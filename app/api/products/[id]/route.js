// GET /api/products/tee
import { NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/data';

export function GET(request, { params }) {
  const product = PRODUCTS.find((p) => p.id === params.id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json(product);
}
