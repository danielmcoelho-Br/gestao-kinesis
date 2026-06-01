"use client";
 
import UsuariosPageContent from "./usuarios/page_content";

export default function AdminCentralPage() {
  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px', margin: 0, color: 'var(--text-primary)' }}>Central de Administração</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '8px' }}>
          Gerencie perfis de acesso, contas de usuários e comissões dos profissionais em um único lugar.
        </p>
      </div>

      <UsuariosPageContent />
    </div>
  );
}
