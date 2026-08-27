import { strict as assert } from 'node:assert'; import { FundamentalRepository } from '../fundamental-repository.ts'; import { createServerSupabaseClient } from '../../../supabase/server-client.ts';
const iso=(value:string)=>{const date=new Date(value);assert.ok(!Number.isNaN(date.valueOf()));return date.toISOString();};
// Runtime invocation supplies fixtures; canonical UTC comparison intentionally accepts DB +00:00 serialization.
export const sameInstant=(a:string,b:string)=>iso(a)===iso(b);
