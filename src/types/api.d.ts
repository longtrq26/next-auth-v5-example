export interface LoginResponse {
  success: boolean;
  message: string;
  data: UserInfo;
  token: TokenInfo;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  token: TokenInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  customer_code: string;
  registered: string;
  roles: string[];
  capabilities: string[];
  email_verified: boolean;
  phone: string;
  gender: string;
  date_of_birth: string;
}

export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  refreshPayload: JWTPayload;
  accessPayload: JWTPayload;
}

export interface JwtPayload {
  iss: string;
  user_id: number;
  type: "access" | "refresh";
  iat: string;
  exp: string;
  session_id: string;
}
