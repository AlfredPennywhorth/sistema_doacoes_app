const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DONATION_IMAGES_BUCKET = "donation-images";
const GENERIC_FAILURE_MESSAGE =
  "Nao foi possivel concluir a exclusao da conta. Tente novamente mais tarde.";

interface SupabaseAdminClient {
  auth: {
    getUser: (
      jwt: string,
    ) => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
    admin: {
      deleteUser: (userId: string) => Promise<{ error: unknown }>;
    };
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{
        data: Array<{ image_url: string | null }>;
        error: unknown;
      }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      remove: (
        paths: string[],
      ) => Promise<{
        data: Array<{ name?: string; error?: unknown }> | null;
        error: unknown;
      }>;
    };
  };
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>;
}

interface DeleteUserDeps {
  createAdminClient: () => SupabaseAdminClient;
  logger?: {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export function extractStoragePathFromUrl(
  imageUrl: string,
  bucket = DONATION_IMAGES_BUCKET,
): string | null {
  if (!imageUrl) return null;

  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  const sanitize = (rawPath: string): string | null => {
    const normalized = decodeURIComponent(rawPath)
      .replace(/^\/+/, "")
      .replace(/^\.+\//, "");

    if (!normalized || normalized.includes("..")) return null;
    return normalized;
  };

  if (!trimmed.includes("://")) {
    const withoutBucketPrefix = trimmed.replace(new RegExp(`^${bucket}/`), "");
    return sanitize(withoutBucketPrefix);
  }

  try {
    const parsed = new URL(trimmed);
    const candidates = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
    ];

    for (const prefix of candidates) {
      const idx = parsed.pathname.indexOf(prefix);
      if (idx !== -1) {
        const rawPath = parsed.pathname.slice(idx + prefix.length);
        return sanitize(rawPath);
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function buildDeleteUserHandler({
  createAdminClient,
  logger = console,
}: DeleteUserDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    try {
      const token = getBearerToken(req.headers.get("Authorization"));
      if (!token) {
        return jsonResponse({ error: "Nao autorizado." }, 401);
      }

      const supabaseAdmin = createAdminClient();

      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        logger.warn("[delete-user] JWT invalido ou usuario nao encontrado.");
        return jsonResponse({ error: "Nao autorizado." }, 401);
      }

      const userId = user.id;
      logger.info(
        `[delete-user] Solicitacao de exclusao para usuario ${userId}.`,
      );

      const { data: userItems, error: itemsError } = await supabaseAdmin
        .from("items")
        .select("image_url")
        .eq("user_id", userId);

      if (itemsError) {
        logger.error(
          `[delete-user] Falha ao buscar imagens do usuario ${userId}.`,
        );
        return jsonResponse({ error: GENERIC_FAILURE_MESSAGE }, 500);
      }

      const imagePaths = Array.from(
        new Set(
          (userItems ?? [])
            .map((item) => item.image_url)
            .filter((url): url is string => Boolean(url))
            .map((url) => extractStoragePathFromUrl(url))
            .filter((path): path is string => Boolean(path)),
        ),
      );

      if (imagePaths.length > 0) {
        const { data: removedData, error: storageError } =
          await supabaseAdmin.storage
            .from(DONATION_IMAGES_BUCKET)
            .remove(imagePaths);

        if (storageError) {
          logger.error(`[delete-user] Falha ao remover imagens de ${userId}.`);
          return jsonResponse({ error: GENERIC_FAILURE_MESSAGE }, 500);
        }

        const hasRemoveFailure = (removedData ?? []).some((entry) =>
          Boolean(entry?.error),
        );
        if (hasRemoveFailure) {
          logger.error(
            `[delete-user] Remocao parcial de imagens detectada para ${userId}.`,
          );
          return jsonResponse({ error: GENERIC_FAILURE_MESSAGE }, 500);
        }
      }

      const { error: cleanupError } = await supabaseAdmin.rpc(
        "cleanup_user_account_data",
        {
          p_user_id: userId,
        },
      );

      if (cleanupError) {
        logger.error(
          `[delete-user] Falha na limpeza transacional para ${userId}.`,
        );
        return jsonResponse({ error: GENERIC_FAILURE_MESSAGE }, 500);
      }

      const { error: deleteUserError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        logger.error(
          `[delete-user] Falha ao remover usuario do Auth ${userId}.`,
        );
        return jsonResponse({ error: GENERIC_FAILURE_MESSAGE }, 500);
      }

      logger.info(`[delete-user] Exclusao concluida para ${userId}.`);
      return jsonResponse({
        success: true,
        message: "Conta excluida com sucesso.",
      });
    } catch {
      logger.error("[delete-user] Erro inesperado durante exclusao.");
      return jsonResponse({ error: GENERIC_FAILURE_MESSAGE }, 500);
    }
  };
}
