/**
 * @file decodificador.ts
 * @description Decodificador universal de códigos y URLs escaneadas desde Google Wallet.
 */

export interface CodigoDecodificado {
  /** El código limpio / token extraído */
  codigoLimpio: string;
  /** Tipo de formato detectado */
  formato: 'jwt_wallet' | 'objeto_wallet' | 'prefijo_sigic' | 'url' | 'directo';
  /** Token original si se pudo extraer */
  tokenOriginal?: string;
  /** ID de objeto Google Wallet si estaba presente */
  objetoId?: string;
}

/**
 * Decodifica cualquier código o URL proveniente de Google Wallet, cámaras o escáneres.
 */
export function decodificarCodigoGoogleWallet(entrada: string): CodigoDecodificado {
  const texto = String(entrada || '').trim();

  // 1. URL de guardado de Google Wallet: pay.google.com/gp/v/save/<jwt>
  if (texto.includes('pay.google.com/gp/v/save/')) {
    const jwtParte = texto.split('pay.google.com/gp/v/save/')[1]?.split(/[?#&]/)[0] || '';
    if (jwtParte.includes('.')) {
      try {
        const payloadBase64 = jwtParte.split('.')[1];
        const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        
        // Buscar barcode value
        const objetos = payload?.payload?.eventTicketObjects || payload?.payload?.genericObjects || [];
        if (objetos.length > 0) {
          const primer = objetos[0];
          const valorBarcode = primer?.barcode?.value;
          const objetoId = primer?.id;
          if (valorBarcode) {
            const limpio = valorBarcode.replace(/^SIGIC:/i, '').trim();
            return { codigoLimpio: limpio, formato: 'jwt_wallet', tokenOriginal: limpio, objetoId };
          }
        }
      } catch {
        // Fallback si falla decodificar base64
      }
    }
  }

  // 2. Prefijo común institucional: SIGIC:<token>
  if (texto.toUpperCase().startsWith('SIGIC:')) {
    const limpio = texto.slice(6).trim();
    return { codigoLimpio: limpio, formato: 'prefijo_sigic', tokenOriginal: limpio };
  }

  // 3. Identificador de objeto Google Wallet: 3388...sigic-ceremonia-token
  if (texto.includes('.sigic-') || texto.includes('sigic-')) {
    const partes = texto.split('-');
    const ultimo = partes[partes.length - 1];
    return { codigoLimpio: ultimo, formato: 'objeto_wallet', objetoId: texto, tokenOriginal: ultimo };
  }

  // 4. Parámetro token en URL: ?token=XYZ
  if (texto.includes('token=')) {
    const match = texto.match(/[?&]token=([^&]+)/i);
    if (match && match[1]) {
      const limpio = decodeURIComponent(match[1]).trim();
      return { codigoLimpio: limpio, formato: 'url', tokenOriginal: limpio };
    }
  }

  return { codigoLimpio: texto, formato: 'directo', tokenOriginal: texto };
}
