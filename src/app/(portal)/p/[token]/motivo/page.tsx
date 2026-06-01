import { getPatientByToken } from "../../../actions";
import { notFound } from "next/navigation";
import { AlertCircle } from "lucide-react";
import MotivoClient from "./MotivoClient";

export const dynamic = "force-dynamic";

export default async function MotivoPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const patient = await getPatientByToken(token);

    if (!patient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] padding-6 text-center px-4">
                <AlertCircle size={48} className="text-red-500" />
                <h1 className="font-black mt-4 text-xl">Link Expirado ou Inválido</h1>
                <p className="text-slate-500 mt-2 text-sm max-w-xs">
                    Não encontramos este acesso. Solicite um novo link de contato para a recepção da Kinesis.
                </p>
            </div>
        );
    }

    return <MotivoClient patient={patient as any} token={token} />;
}
