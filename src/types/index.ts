export interface User {
    id?: number;
    username: string;
    email: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface ApiError {
    detail: string;
}

export interface Moto {
    id?: number;
    placa: string;
    marca: string;
    modelo: string;
    kilometraje_actual: number; // TS obligará a que sea número
    user_id?: number;
}