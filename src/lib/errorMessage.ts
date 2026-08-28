/**
 * `error instanceof Error` sozinho perde a mensagem real de erros do Postgrest/Supabase
 * (ex.: violação de RLS, "User already registered" do admin.inviteUserByEmail) -- esses
 * objetos têm `.message` mas não estendem `Error`, então caem no fallback genérico mesmo
 * quando a causa real já está disponível. Achado real: convite pra e-mail já cadastrado
 * mostrava só "Não foi possível salvar o usuário.", escondendo o motivo de verdade.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message || fallback;
  }
  return fallback;
}
