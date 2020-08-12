const testAdminKey = "testAdmin"

process.env.CROWNSTONE_USER_ADMIN_KEY = testAdminKey;

const api_auth_base = '?api_key='
const admin_auth_base = '?admin_key='

export function api_auth(key : string) : string {
  return api_auth_base + key;
}

export function admin_auth(key? : string) : string {
  return admin_auth_base + (key || testAdminKey)
}

