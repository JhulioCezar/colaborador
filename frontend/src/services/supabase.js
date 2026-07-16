import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Funções de autenticação
export const registerUser = async (username, password) => {
  const { data, error } = await supabase
    .rpc('register_user', { p_username: username, p_password: password });
  
  if (error) throw new Error(error.message);
  return data;
};

export const loginUser = async (username, password) => {
  const { data, error } = await supabase
    .rpc('login_user', { p_username: username, p_password: password });
  
  if (error) throw new Error(error.message);
  return data;
};

// Funções de pessoas
export const listPessoas = async (userId) => {
  const { data, error } = await supabase
    .rpc('list_pessoas', { p_user_id: userId });
  
  if (error) throw new Error(error.message);
  return data;
};

export const createPessoa = async (pessoaData) => {
  const { data, error } = await supabase
    .rpc('create_pessoa', pessoaData);
  
  if (error) throw new Error(error.message);
  return data;
};
