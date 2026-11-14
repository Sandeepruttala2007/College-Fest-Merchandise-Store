// GET /api/products  or  /api/products?category=Clothing
import { NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/data';

export function GET(request) {
  const category = new URL(request.url).searchParams.get('category');
  const list = category
    ? PRODUCTS.filter((product) => product.category.toLowerCase() === category.toLowerCase())
    : PRODUCTS;
  return NextResponse.json(list);
}
