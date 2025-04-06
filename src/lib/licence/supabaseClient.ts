// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pwuxvqdslwfvyofndpwu.supabase.co'; // Remplacez par votre URL Supabase
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dXh2cWRzbHdmdnlvZm5kcHd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxMTk2NjksImV4cCI6MjA0ODY5NTY2OX0.XkH0sSrCyynkJfteCWAugs-QmWIOKuujE26FdVRZcaI'; // Remplacez par votre clé publique

export const supabase = createClient(supabaseUrl, supabaseKey);
