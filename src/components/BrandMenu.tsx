import { Menu } from 'lucide-react';

function BrandWordmark({ companyName }: { companyName: string }) {
  if (companyName === 'DecidAI') {
    return <span><strong>Decid<span className="brand-wordmark-accent">AI</span></strong></span>;
  }
  return <span><strong>{companyName}</strong></span>;
}

type Props = {
  companyName: string;
  markSrc: string;
};

/**
 * Marca estática do topo da sidebar -- até 28/08 abria um dropdown próprio ("Perfil",
 * "Administração", "Marketplace"...) duplicando o menu de conta do topo-direito
 * (UserMenu). Usuário pediu pra mesclar os dois num só, mesmo padrão do menu de conta do
 * Jira/Rovo: um único gatilho (avatar, topo-direito), sem repetir opção em dois lugares.
 */
export function BrandMenu({ companyName, markSrc }: Props) {
  return (
    <div className="brand-menu-wrap">
      <div className="brand">
        <div className="brand-left">
          <Menu size={23} />
          <BrandWordmark companyName={companyName} />
        </div>
        <img className="radar-mark" src={markSrc} alt="" width={30} height={30} />
      </div>
    </div>
  );
}

export default BrandMenu;
