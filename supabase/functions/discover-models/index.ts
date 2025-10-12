import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiscoverModelsRequest {
  apiKey: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey }: DiscoverModelsRequest = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Discovering OpenRouter models...');

    // Call OpenRouter models endpoint
    const modelsResponse = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.error('OpenRouter API error:', modelsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch models from OpenRouter' }),
        { status: modelsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const modelsData = await modelsResponse.json();
    
    // Filter and categorize models
    const freeModels = modelsData.data.filter((model: any) => 
      model.pricing?.prompt === '0' || model.id.includes(':free')
    );

    const paidModels = modelsData.data.filter((model: any) => 
      model.pricing?.prompt !== '0' && !model.id.includes(':free')
    );

    // Select best free models for different tasks
    const bestFreeChat = freeModels.find((m: any) => 
      m.id.includes('gemini') || m.id.includes('llama')
    ) || freeModels[0];

    const bestFreeEmbedding = freeModels.find((m: any) => 
      m.id.includes('embed')
    );

    console.log(`Discovered ${freeModels.length} free models and ${paidModels.length} paid models`);
    console.log('Best free chat model:', bestFreeChat?.id);
    console.log('Best free embedding model:', bestFreeEmbedding?.id);

    return new Response(
      JSON.stringify({
        success: true,
        freeModels: freeModels.slice(0, 10), // Return top 10 free models
        paidModels: paidModels.slice(0, 10), // Return top 10 paid models
        recommended: {
          chat: bestFreeChat?.id || 'google/gemini-2.0-flash-exp:free',
          embedding: bestFreeEmbedding?.id || 'text-embedding-3-small',
        },
        totalModels: modelsData.data.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in discover-models function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
