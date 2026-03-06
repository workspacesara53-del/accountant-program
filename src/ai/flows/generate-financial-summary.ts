'use server';
/**
 * @fileOverview A Genkit flow for generating a concise financial performance summary.
 *
 * - generateFinancialSummary - A function that generates an AI-powered summary of financial performance.
 * - FinancialSummaryInput - The input type for the generateFinancialSummary function.
 * - FinancialSummaryOutput - The return type for the generateFinancialSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FinancialSummaryInputSchema = z.object({
  totalProfits: z.number().describe('Total accumulated profits.'),
  totalLosses: z.number().describe('Total accumulated losses.'),
  availableCapital: z.number().describe('Currently available capital.'),
  totalOwedByCustomers: z.number().describe('Total amount owed by customers for their orders.'),
  totalOwedToSuppliers: z.number().describe('Total amount owed to suppliers for purchased products.'),
});
export type FinancialSummaryInput = z.infer<typeof FinancialSummaryInputSchema>;

const FinancialSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise AI-generated summary of the financial performance.'),
});
export type FinancialSummaryOutput = z.infer<typeof FinancialSummaryOutputSchema>;

export async function generateFinancialSummary(input: FinancialSummaryInput): Promise<FinancialSummaryOutput> {
  return financialSummaryFlow(input);
}

const financialSummaryPrompt = ai.definePrompt({
  name: 'financialSummaryPrompt',
  input: { schema: FinancialSummaryInputSchema },
  output: { schema: FinancialSummaryOutputSchema },
  prompt: `You are a financial analyst. Provide a concise, AI-generated summary of the business's financial performance based on the following data.
Focus on total profits, losses, available capital, and overall outstanding balances (both owed to the business and owed by the business).
Highlight the key aspects of the current financial health.

Financial Data:
- Total Profits: {{{totalProfits}}}
- Total Losses: {{{totalLosses}}}
- Available Capital: {{{availableCapital}}}
- Total Owed By Customers: {{{totalOwedByCustomers}}}
- Total Owed To Suppliers: {{{totalOwedToSuppliers}}}`,
});

const financialSummaryFlow = ai.defineFlow(
  {
    name: 'financialSummaryFlow',
    inputSchema: FinancialSummaryInputSchema,
    outputSchema: FinancialSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await financialSummaryPrompt(input);
    return output!;
  }
);
