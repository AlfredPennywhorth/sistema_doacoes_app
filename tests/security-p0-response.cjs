'use strict';
// Require explicit PostgreSQL permission error, not merely a non-2xx HTTP status.
// For example 400/42703 (undefined column) must never pass the security gate.
function isPrivilegeDenied(response) {
  return response !== null &&
    typeof response === 'object' &&
    (response.status === 401 || response.status === 403) &&
    response.data !== null &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data) &&
    response.data.code === '42501';
}
module.exports = { isPrivilegeDenied };
