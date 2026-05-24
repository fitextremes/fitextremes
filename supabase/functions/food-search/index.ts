import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseAuth = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

interface FoodResult {
  id: string;
  name: string;
  brand?: string;
  serving_size: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'usda' | 'off';
}

const USDA_KEY = Deno.env.get('USDA_API_KEY');

async function searchUSDA(query: string): Promise<FoodResult[]> {
  if (!USDA_KEY) return [];
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=15&api_key=${USDA_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const foods = data.foods ?? [];
  return foods.map((f: any) => {
    const get = (n: string) =>
      Number(f.foodNutrients?.find((x: any) => x.nutrientName?.toLowerCase().includes(n))?.value ?? 0);
    return {
      id: `usda-${f.fdcId}`,
      name: f.description,
      brand: f.brandOwner || f.brandName || undefined,
      serving_size:
        f.servingSize && f.servingSizeUnit
          ? `${f.servingSize} ${f.servingSizeUnit}`
          : '100 g',
      calories: get('energy'),
      protein: get('protein'),
      carbs: get('carbohydrate'),
      fat: get('total lipid') || get('fat'),
      source: 'usda' as const,
    };
  });
}

async function searchOFF(query: string): Promise<FoodResult[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15`;
  const res = await fetch(url, { headers: { 'User-Agent': 'FitExtremes/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  const products = data.products ?? [];
  return products
    .filter((p: any) => p.nutriments?.['energy-kcal_100g'] != null || p.nutriments?.['energy-kcal_serving'] != null)
    .map((p: any) => {
      const n = p.nutriments ?? {};
      const servingText = p.serving_size || '100 g';
      const useServing = n['energy-kcal_serving'] != null;
      return {
        id: `off-${p.code}`,
        name: p.product_name || p.generic_name || 'Unknown',
        brand: p.brands || undefined,
        serving_size: useServing ? servingText : '100 g',
        calories: Number(useServing ? n['energy-kcal_serving'] : n['energy-kcal_100g']) || 0,
        protein: Number(useServing ? n.proteins_serving : n.proteins_100g) || 0,
        carbs: Number(useServing ? n.carbohydrates_serving : n.carbohydrates_100g) || 0,
        fat: Number(useServing ? n.fat_serving : n.fat_100g) || 0,
        source: 'off' as const,
      };
    });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const usda = await searchUSDA(query.trim());
    let results = usda;
    if (usda.length < 5) {
      const off = await searchOFF(query.trim());
      results = [...usda, ...off].slice(0, 25);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), results: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
