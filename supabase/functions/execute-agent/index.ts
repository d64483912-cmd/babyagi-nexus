import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExecuteAgentRequest {
  agentId: string;
  apiKey: string;
  model?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, apiKey, model = 'google/gemini-2.0-flash-exp:free' }: ExecuteAgentRequest = await req.json();

    if (!agentId || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Agent ID and API key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Executing agent ${agentId} with model ${model}`);

    // Get agent details
    const { data: agent, error: agentError } = await supabaseClient
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update agent status to running
    await supabaseClient
      .from('agents')
      .update({ 
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    // Log agent start
    await supabaseClient
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        level: 'info',
        message: `Agent started with model: ${model}`,
        metadata: { model, objective: agent.objective }
      });

    // Get pending tasks
    const { data: tasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(5);

    console.log(`Found ${tasks?.length || 0} pending tasks`);

    // Process tasks one by one
    for (const task of tasks || []) {
      try {
        // Update task status
        await supabaseClient
          .from('tasks')
          .update({ 
            status: 'running',
            started_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        // Log task start
        await supabaseClient
          .from('agent_logs')
          .insert({
            agent_id: agentId,
            task_id: task.id,
            level: 'info',
            message: `Executing task: ${task.description}`,
          });

        // Call OpenRouter to process the task
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: `You are an autonomous AI agent with the following objective: ${agent.objective}. Execute tasks efficiently and provide detailed results.`
              },
              {
                role: 'user',
                content: task.description
              }
            ],
          }),
        });

        if (!openRouterResponse.ok) {
          throw new Error(`OpenRouter API error: ${openRouterResponse.status}`);
        }

        const result = await openRouterResponse.json();
        const taskResult = result.choices[0].message.content;

        // Update task with result
        await supabaseClient
          .from('tasks')
          .update({ 
            status: 'completed',
            result: taskResult,
            completed_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        // Store in memory
        await supabaseClient
          .from('memories')
          .insert({
            agent_id: agentId,
            content: `Task: ${task.description}\nResult: ${taskResult}`,
            metadata: { task_id: task.id }
          });

        // Log task completion
        await supabaseClient
          .from('agent_logs')
          .insert({
            agent_id: agentId,
            task_id: task.id,
            level: 'info',
            message: `Task completed successfully`,
            metadata: { result: taskResult.substring(0, 100) }
          });

      } catch (taskError) {
        console.error(`Error processing task ${task.id}:`, taskError);
        
        // Update task with error
        await supabaseClient
          .from('tasks')
          .update({ 
            status: 'failed',
            error: taskError instanceof Error ? taskError.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', task.id);

        // Log error
        await supabaseClient
          .from('agent_logs')
          .insert({
            agent_id: agentId,
            task_id: task.id,
            level: 'error',
            message: `Task failed: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`,
          });
      }
    }

    // Update agent status
    await supabaseClient
      .from('agents')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    // Log agent completion
    await supabaseClient
      .from('agent_logs')
      .insert({
        agent_id: agentId,
        level: 'info',
        message: `Agent execution completed. Processed ${tasks?.length || 0} tasks.`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        agentId,
        tasksProcessed: tasks?.length || 0,
        message: 'Agent execution completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in execute-agent function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
