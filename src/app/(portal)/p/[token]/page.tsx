import { getPatientByToken } from "../../actions";
import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import PortalClient from "./PortalClient";

export const dynamic = "force-dynamic";

export default async function PortalHome({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const patient = await getPatientByToken(token);

    if (!patient) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '24px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#EF4444" />
                <h1 style={{ fontWeight: 800, marginTop: 16, fontSize: '1.5rem' }}>Link Inválido</h1>
                <p style={{ color: '#64748B', marginTop: 8 }}>Não foi possível encontrar seu acesso. Peça um novo link pelo WhatsApp da clínica.</p>
            </div>
        );
    }

    return <PortalClient patient={patient as any} token={token} />;
}
