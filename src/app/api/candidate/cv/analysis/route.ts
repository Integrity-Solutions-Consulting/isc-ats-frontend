import { NextResponse } from 'next/server';
import { backendGet, backendPost, BackendError } from '@/lib/backendFetch';

async function forward(request: Request, retry: boolean) {
  const id = new URL(request.url).searchParams.get('candidateId');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 });
  try {
    const path = `/recruitment/candidates/${id}/cv/analysis`;
    const data = retry ? await backendPost(path, {}) : await backendGet(path);
    return NextResponse.json(data, { status: retry ? 202 : 200 });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo consultar o reintentar el análisis.' },
      { status: error instanceof BackendError ? error.status : 500 });
  }
}

export async function GET(request: Request) { return forward(request, false); }
export async function POST(request: Request) { return forward(request, true); }
