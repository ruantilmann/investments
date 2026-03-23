import type { FastifyInstance } from 'fastify';
import { CreateUserService, GetAllUsersService, GetUserById, GetUserByName, GetUserByEmail } from '../services/userServices';
import { newUserSchema } from '../models/user.model';

export async function userRoutes(server: FastifyInstance) {
    server.post('/newUser', async (req, res) => {
        try {
            const body = newUserSchema.parse(req.body);
            const createUserService = new CreateUserService();
            const user = await createUserService.createUser(body);
            res.status(201).send(user);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).send({ error: errorMessage });
        }
    });

    server.get('/allUsers', async (req, res) => {
        try {
            const getAllUsersService = new GetAllUsersService();
            const users = await getAllUsersService.getAllUsers();
            res.status(200).send(users);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).send({ error: errorMessage });
        }
    });

    server.get('/:id', async (req, res) => {
        try {
            const { id } = req.params as { id: string };
            const getUserByIdService = new GetUserById();
            const user = await getUserByIdService.execute(Number(id));
            res.status(200).send(user);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).send({ error: errorMessage });
        }
    });

    server.get('/search', async (req, res) => {
        try {
            const { name } = req.query as { name: string };
            const getUserByNameService = new GetUserByName();
            const users = await getUserByNameService.execute(name);
            res.status(200).send(users);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).send({ error: errorMessage });
        }
    });

    server.get('/searchByEmail', async (req, res) => {
        try {
            const { email } = req.query as { email: string };
            const getUserByEmailService = new GetUserByEmail();
            const user = await getUserByEmailService.execute(email);
            res.status(200).send(user);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            res.status(400).send({ error: errorMessage });
        }
    });
}

