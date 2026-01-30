import { get, post } from './crud';

export type Admin = {
  id?: number;
  username: string;
  email: string;
};

// get the admins
export async function getAdmins(): Promise<Admin[]> {
  return get<Admin[]>('admins');
}

// add an admin
export async function addAdmin(params: {
  username: string;
  email: string;
}): Promise<{ success: true; id: number; username: string; email: string }> {
  return post<{ success: true; id: number; username: string; email: string }>(
    'admins',
    params
  );
}
