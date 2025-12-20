export type AccessTokenPayload = {
    sub: string;
    typ: 'access';
    iat: number;
    exp: number;
};

export type RefreshTokenPayload = {
    sub: string;
    typ: 'refresh';
    iat: number;
    exp: number;
};
