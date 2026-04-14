import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://acfioaefbinrsqslqjnu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-_mIVQuVMhVMSM6FpF3eSg_SS1SgIM6";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
