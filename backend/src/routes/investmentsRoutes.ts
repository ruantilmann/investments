import type { FastifyInstance } from "fastify";
import { CreateInvestmentService, GetAllInvestmentsService } from "../services/investmentServices.ts";
import { newInvestmentSchema } from "../models/investment.model.ts";

export async function investmentRoutes(server: FastifyInstance) {

  server.post('/newInvestment', async (req, res) => {
    try {
      const body = newInvestmentSchema.parse(req.body);
      
      const createInvestmentService = new CreateInvestmentService();
      const investment = await createInvestmentService.createInvestment(body);
      
      res.status(201).send(investment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(400).send({ error: errorMessage });
    }
  });

  /*-----------------------------------------------------------------*/

  server.get('/allInvestments', async (req, res) => {
    try {
      const getAllInvestmentsService = new GetAllInvestmentsService();

      const {page = '1', limit = '10'} = req.query as { 
        page?: string;
        limit?: string; 
      };
      
      const pageNumber = Math.max(1, Number(page));
      const limitNumber = Math.max(1, Number(limit));

      const investments = await getAllInvestmentsService.getAllInvestments(pageNumber, limitNumber);
      res.status(200).send(investments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(400).send({ error: errorMessage });
    }
  });

  /*-----------------------------------------------------------------*/

  server.get('/investments/:owner', async (req, res) => {
    try {
      const { owner } = req.params as { owner: string };

      const {page = '1', limit = '10'} = req.query as { 
        page?: string;
        limit?: string; 
      };

      const pageNumber = Math.max(1, Number(page));
      const limitNumber = Math.max(1, Number(limit));

      const getAllInvestmentsService = new GetAllInvestmentsService();
      const { data: investments } = await getAllInvestmentsService.getAllInvestmentsByOwner(
        owner,
        pageNumber,
        limitNumber
      );
      
      const filteredInvestments = investments.filter(investment => investment.owner === owner);
      
      res.status(200).send(filteredInvestments);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(400).send({ error: errorMessage });
    }
  });
}
