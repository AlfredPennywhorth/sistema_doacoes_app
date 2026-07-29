import {
    buildDeleteUserHandler,
    extractStoragePathFromUrl,
} from "../supabase/functions/delete-user/deleteUserHandler";

describe("delete-user edge handler", () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("extracts object paths safely from Supabase URLs and raw paths", () => {
    expect(
      extractStoragePathFromUrl(
        "https://example.supabase.co/storage/v1/object/public/donation-images/donations/a%20b.jpg",
      ),
    ).toBe("donations/a b.jpg");

    expect(extractStoragePathFromUrl("donations/local-file.png")).toBe(
      "donations/local-file.png",
    );
    expect(extractStoragePathFromUrl("")).toBeNull();
  });

  it("returns 401 for invalid JWT", async () => {
    const adminClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({
            data: { user: null },
            error: { message: "invalid" },
          }),
        admin: { deleteUser: jest.fn() },
      },
      from: jest.fn(),
      storage: { from: jest.fn() },
      rpc: jest.fn(),
    };

    const handler = buildDeleteUserHandler({
      createAdminClient: () => adminClient as any,
      logger,
    });
    const response = await handler(
      new Request("https://example.com/functions/v1/delete-user", {
        method: "POST",
        headers: { Authorization: "Bearer invalid-token" },
      }),
    );

    expect(response.status).toBe(401);
    expect(adminClient.auth.admin.deleteUser).not.toHaveBeenCalled();
  });

  it("deletes files, runs RPC cleanup and deletes auth user on success", async () => {
    const removeMock = jest
      .fn()
      .mockResolvedValue({ data: [{ name: "ok" }], error: null });
    const rpcMock = jest.fn().mockResolvedValue({ data: null, error: null });
    const deleteUserMock = jest.fn().mockResolvedValue({ error: null });

    const adminClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
        admin: { deleteUser: deleteUserMock },
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                image_url:
                  "https://example.supabase.co/storage/v1/object/public/donation-images/donations/item-1.jpg",
              },
            ],
            error: null,
          }),
        })),
      })),
      storage: {
        from: jest.fn(() => ({ remove: removeMock })),
      },
      rpc: rpcMock,
    };

    const handler = buildDeleteUserHandler({
      createAdminClient: () => adminClient as any,
      logger,
    });

    const response = await handler(
      new Request("https://example.com/functions/v1/delete-user", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
      }),
    );

    expect(response.status).toBe(200);
    expect(removeMock).toHaveBeenCalledWith(["donations/item-1.jpg"]);
    expect(rpcMock).toHaveBeenCalledWith("cleanup_user_account_data", {
      p_user_id: "user-1",
    });
    expect(deleteUserMock).toHaveBeenCalledWith("user-1");
  });

  it("prevents auth deletion if storage cleanup fails", async () => {
    const deleteUserMock = jest.fn();
    const rpcMock = jest.fn();

    const adminClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-2" } }, error: null }),
        admin: { deleteUser: deleteUserMock },
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [{ image_url: "donations/item-2.jpg" }],
            error: null,
          }),
        })),
      })),
      storage: {
        from: jest.fn(() => ({
          remove: jest
            .fn()
            .mockResolvedValue({ data: null, error: { message: "fail" } }),
        })),
      },
      rpc: rpcMock,
    };

    const handler = buildDeleteUserHandler({
      createAdminClient: () => adminClient as any,
      logger,
    });

    const response = await handler(
      new Request("https://example.com/functions/v1/delete-user", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
      }),
    );

    expect(response.status).toBe(500);
    expect(rpcMock).not.toHaveBeenCalled();
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("prevents auth deletion if relational cleanup RPC fails", async () => {
    const deleteUserMock = jest.fn();

    const adminClient = {
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-3" } }, error: null }),
        admin: { deleteUser: deleteUserMock },
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      })),
      storage: {
        from: jest.fn(() => ({
          remove: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      },
      rpc: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: "rpc fail" } }),
    };

    const handler = buildDeleteUserHandler({
      createAdminClient: () => adminClient as any,
      logger,
    });

    const response = await handler(
      new Request("https://example.com/functions/v1/delete-user", {
        method: "POST",
        headers: { Authorization: "Bearer valid-token" },
      }),
    );

    expect(response.status).toBe(500);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });
});
