'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { ParsedEndpoint } from './definitions';
import { insertApiEndpoints } from './data';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    throw new Error('Database Error: Failed to Create Invoice.');
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

// ==================== API Document Crawler ====================

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;

export async function crawlOpenApi(
  url: string
): Promise<{ endpoints: ParsedEndpoint[]; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { endpoints: [], error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const openApiDoc = await response.json();

    if (!openApiDoc.paths || typeof openApiDoc.paths !== 'object') {
      return { endpoints: [], error: 'Invalid OpenAPI document: missing or invalid "paths" field' };
    }

    const endpoints: ParsedEndpoint[] = [];

    for (const [path, pathItem] of Object.entries(openApiDoc.paths as Record<string, Record<string, unknown>>)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!HTTP_METHODS.includes(method as typeof HTTP_METHODS[number])) continue;

        const op = operation as {
          summary?: string;
          description?: string;
          parameters?: unknown[];
          requestBody?: unknown;
          responses?: Record<string, unknown>;
        };

        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: op.summary || op.description || null,
          parameters: op.parameters || [],
          request_body: op.requestBody || null,
          responses: op.responses || {},
        });
      }
    }

    return { endpoints };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { endpoints: [], error: 'Request timeout (30s)' };
      }
      return { endpoints: [], error: err.message };
    }
    return { endpoints: [], error: 'Unknown error occurred' };
  }
}

export async function saveApiEndpoints(
  endpoints: ParsedEndpoint[],
  sourceUrl: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const count = await insertApiEndpoints(endpoints, sourceUrl);
    revalidatePath('/dashboard/crawler');
    return { success: true, count };
  } catch (err) {
    console.error(err);
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}