import { httpRequest } from '../../lib/http';
import type { PaginatedResponse, User, UserWithWallet } from '../../types';

type ListUsersParams = {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
};

export function listUsers(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
  const search = new URLSearchParams();

  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  if (params.name) search.set('name', params.name);
  if (params.email) search.set('email', params.email);

  const suffix = search.toString() ? `?${search.toString()}` : '';
  return httpRequest<PaginatedResponse<User>>(`/api/users/allUsers${suffix}`);
}

export function createUser(input: { name: string; email: string }): Promise<UserWithWallet> {
  return httpRequest<UserWithWallet>('/api/users/newUser', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
