package com.sigic.movil_flutter

import android.nfc.NdefMessage
import android.nfc.NdefRecord
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.Ndef
import android.nfc.tech.NdefFormatable
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.nio.charset.Charset

class MainActivity : FlutterActivity(), NfcAdapter.ReaderCallback {
    private val CHANNEL = "com.sigic.movil_flutter/nfc"
    private var nfcAdapter: NfcAdapter? = null

    @Volatile
    private var modoActual: String = "IDLE" // "WRITE" | "READ" | "IDLE"

    @Volatile
    private var urlPendienteGrabacion: String? = null

    @Volatile
    private var resultadoPendiente: MethodChannel.Result? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        nfcAdapter = NfcAdapter.getDefaultAdapter(this)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "disponible" -> {
                    val activo = nfcAdapter != null && nfcAdapter!!.isEnabled
                    result.success(mapOf(
                        "soportado" to (nfcAdapter != null),
                        "activo" to activo
                    ))
                }
                "grabarUrl" -> {
                    val url = call.argument<String>("url") ?: ""
                    if (url.isEmpty()) {
                        result.error("URL_VACIA", "El enlace NFC a grabar esta vacio.", null)
                        return@setMethodCallHandler
                    }
                    val adapter = nfcAdapter
                    if (adapter == null) {
                        result.error("SIN_NFC", "Este telefono no cuenta con chip fisico NFC.", null)
                        return@setMethodCallHandler
                    }
                    if (!adapter.isEnabled) {
                        result.error("NFC_APAGADO", "Activa el NFC en los ajustes rapidos de tu celular.", null)
                        return@setMethodCallHandler
                    }

                    cancelarOperacionPendiente()
                    urlPendienteGrabacion = url
                    modoActual = "WRITE"
                    resultadoPendiente = result
                    habilitarLectorNfc()
                }
                "leerTag" -> {
                    val adapter = nfcAdapter
                    if (adapter == null || !adapter.isEnabled) {
                        result.error("NFC_NO_DISPONIBLE", "Verifica que el NFC este encendido en tu celular.", null)
                        return@setMethodCallHandler
                    }

                    cancelarOperacionPendiente()
                    modoActual = "READ"
                    resultadoPendiente = result
                    habilitarLectorNfc()
                }
                "cancelar" -> {
                    cancelarOperacionPendiente()
                    deshabilitarLectorNfc()
                    result.success(true)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun habilitarLectorNfc() {
        runOnUiThread {
            nfcAdapter?.enableReaderMode(
                this,
                this,
                NfcAdapter.FLAG_READER_NFC_A or
                        NfcAdapter.FLAG_READER_NFC_B or
                        NfcAdapter.FLAG_READER_NFC_F or
                        NfcAdapter.FLAG_READER_NFC_V,
                null
            )
        }
    }

    private fun deshabilitarLectorNfc() {
        runOnUiThread {
            try {
                nfcAdapter?.disableReaderMode(this)
            } catch (_: Exception) {}
        }
    }

    private fun cancelarOperacionPendiente() {
        val prev = resultadoPendiente
        resultadoPendiente = null
        modoActual = "IDLE"
        urlPendienteGrabacion = null
        if (prev != null) {
            runOnUiThread {
                try {
                    prev.error("CANCELADO", "Operacion NFC cancelada.", null)
                } catch (_: Exception) {}
            }
        }
    }

    override fun onTagDiscovered(tag: Tag?) {
        if (tag == null) return
        val uidHex = tag.id?.joinToString("") { "%02X".format(it) } ?: "NFC-TAG"

        if (modoActual == "WRITE") {
            val url = urlPendienteGrabacion ?: return
            val res = resultadoPendiente ?: return
            resultadoPendiente = null
            modoActual = "IDLE"

            try {
                val uriRecord = NdefRecord.createUri(url)
                val message = NdefMessage(arrayOf(uriRecord))

                val ndef = Ndef.get(tag)
                if (ndef != null) {
                    ndef.connect()
                    if (!ndef.isWritable) {
                        ndef.close()
                        deshabilitarLectorNfc()
                        runOnUiThread {
                            res.error("SOLO_LECTURA", "La tarjeta NFC esta bloqueada contra escritura.", null)
                        }
                        return
                    }
                    if (ndef.maxSize < message.toByteArray().size) {
                        ndef.close()
                        deshabilitarLectorNfc()
                        runOnUiThread {
                            res.error("CAPACIDAD_INSUFICIENTE", "El chip NFC no tiene espacio suficiente (${ndef.maxSize} bytes).", null)
                        }
                        return
                    }
                    ndef.writeNdefMessage(message)
                    ndef.close()
                } else {
                    val formatable = NdefFormatable.get(tag)
                    if (formatable != null) {
                        formatable.connect()
                        formatable.format(message)
                        formatable.close()
                    } else {
                        deshabilitarLectorNfc()
                        runOnUiThread {
                            res.error("NO_SOPORTADO", "El chip NFC no soporta formato NDEF.", null)
                        }
                        return
                    }
                }

                deshabilitarLectorNfc()
                runOnUiThread {
                    res.success(mapOf(
                        "ok" to true,
                        "uidFisico" to uidHex,
                        "urlGrabada" to url
                    ))
                }
            } catch (e: Exception) {
                deshabilitarLectorNfc()
                runOnUiThread {
                    res.error("ERROR_ESCRITURA", "No se pudo grabar el Tag NFC: ${e.message}", null)
                }
            }
        } else if (modoActual == "READ") {
            val res = resultadoPendiente ?: return
            resultadoPendiente = null
            modoActual = "IDLE"

            try {
                var contenidoTexto = ""
                val ndef = Ndef.get(tag)
                if (ndef != null) {
                    ndef.connect()
                    val msg = ndef.ndefMessage
                    if (msg != null && msg.records.isNotEmpty()) {
                        val rec = msg.records[0]
                        val uri = rec.toUri()
                        contenidoTexto = uri?.toString() ?: String(rec.payload, Charset.forName("UTF-8"))
                    }
                    ndef.close()
                }
                deshabilitarLectorNfc()
                runOnUiThread {
                    res.success(mapOf(
                        "ok" to true,
                        "uidFisico" to uidHex,
                        "contenido" to contenidoTexto
                    ))
                }
            } catch (e: Exception) {
                deshabilitarLectorNfc()
                runOnUiThread {
                    res.error("ERROR_LECTURA", "Error al leer Tag NFC: ${e.message}", null)
                }
            }
        }
    }

    override fun onPause() {
        deshabilitarLectorNfc()
        super.onPause()
    }
}
