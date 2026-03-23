import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { CreateUserService, GetAllUsersService, GetUserById, GetUserByName, GetUserByEmail } from '../services/userServices';
import { newUserSchema } from '../models/user.model';
import { parse } from 'node:path';

export async function userRoutes(server: FastifyInstance) {
    server.post('/newUser', async (req, res) => {
        try {
            const body = newUserSchema.parse(req.body);
            const createUserService = new CreateUserService();
            const user = await createUserService.createUser(body);

            res.status(201).send(user);
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(422).send({
                    error: "Validation failed",
                    details: error.flatten(),
                });
            }

            if (error instanceof Error && error.message === "USER_EMAIL_ALREDY_EXISTS") {
                return res.status(409).send({
                    error: "Email already exists",
                });
            }

            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

            return res.status(500).send({ error: errorMessage });
        }
    });

    server.get('/allUsers', async (req, res) => {
        try {
            const getAllUsersService = new GetAllUsersService();
            const users = await getAllUsersService.getAllUsers();

            res.status(200).send(users);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).send({ error: errorMessage });
        }
    });

    server.get('/:id', async (req, res) => {
        try {
            const { id } = req.params as { id: string };
            const pasedId = Number(id);

            if (!Number.isInteger(pasedId) || pasedId <= 0) {
                return res.status(422).send({ error: 'Invalid user ID' });
            }
            
            const getUserByIdService = new GetUserById();
            const user = await getUserByIdService.execute(pasedId);

            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            return res.status(200).send(user);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(500).send({ error: errorMessage });
        }
    });

    server.get('/search', async (req, res) => {
        try {
            const { name } = req.query as { name: string };

            if (!name || !name.trim()) {
                return res.status(422).send({ error: 'Name query parameter is required' });
            }

            const getUserByNameService = new GetUserByName();
            const users = await getUserByNameService.execute(name.trim());

            return res.status(200).send(users);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

            return res.status(500).send({ error: errorMessage });
        }
    });

    server.get('/searchByEmail', async (req, res) => {
        try {
            const { email } = req.query as { email?: string };

            if (!email) {
                return res.status(422).send({ error: 'Email query parameter is required' });
            }

            const parsedEmail = zEmailSafeParse(email);
            if (!parsedEmail.success) {
                return res.status(422).send({ error: 'Invalid email format' });
            }

            const getUserByEmailService = new GetUserByEmail();
            const user = await getUserByEmailService.execute(parsedEmail.data);

            if(!user) {
                return res.status(404).send({ error: 'User not found' });
            }

            return res.status(200).send(user);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            return res.status(500).send({ error: errorMessage });
        }
    });
}

function zEmailSafeParse(email: string) {
  return newUserSchema.shape.email.safeParse(email);
}
