import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// AUTENTICAÇÃO
// ============================================

// Registrar usuário
export const registerUser = async (username, password) => {
  const { data, error } = await supabase
    .rpc('register_user', { p_username: username, p_password: password });
  
  if (error) throw new Error(error.message);
  return data;
};

// Login
export const loginUser = async (username, password) => {
  const { data, error } = await supabase
    .rpc('login_user', { p_username: username, p_password: password });
  
  if (error) throw new Error(error.message);
  return data;
};

// ============================================
// PESSOAS (CRUD)
// ============================================

// Listar pessoas do usuário
export const listPessoas = async (userId) => {
  const { data, error } = await supabase
    .rpc('list_pessoas', { p_user_id: userId });
  
  if (error) throw new Error(error.message);
  return data;
};

// Criar pessoa
export const createPessoa = async (pessoaData) => {
  const { data, error } = await supabase
    .rpc('create_pessoa', pessoaData);
  
  if (error) throw new Error(error.message);
  return data;
};

// Editar pessoa
export const updatePessoa = async (id, pessoaData) => {
  const { data, error } = await supabase
    .from('pessoas')
    .update(pessoaData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

// Deletar pessoa
export const deletePessoa = async (id) => {
  const { error } = await supabase
    .from('pessoas')
    .delete()
    .eq('id', id);
  
  if (error) throw new Error(error.message);
  return { success: true };
};
