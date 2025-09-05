import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.5.207:3001';

export async function loginApi({ usuario, password }: { usuario: string; password: string }) {
    const response = await axios.post(
        `${API_URL}/api/login`,
        { usuario, password },
        { withCredentials: true }
    );
    return response.data;
}

export async function checkSessionApi() {
    const response = await axios.get(`${API_URL}/api/session`, { withCredentials: true });
    return response.data;
}

export async function logoutApi() {
    const response = await axios.post(`${API_URL}/api/logout`, {}, { withCredentials: true });
    return response.data;
}