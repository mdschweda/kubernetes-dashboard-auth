import { pki } from "node-forge";

export default function createSelfSignedCertificate() {
    let keyPair = pki.rsa.generateKeyPair(2048);
    let cert = pki.createCertificate();

    cert.privateKey = keyPair.privateKey;
    cert.publicKey = keyPair.publicKey;

    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setTime(0);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);
    cert.validity.notAfter.setTime(0);

    let attrs = [{
        name: "commonName",
        value: "Kubernetes Dashboard"
    }];
    cert.setIssuer(attrs);
    cert.setSubject(attrs);

    cert.setExtensions([
        {
            name: "basicConstraints",
            cA: false
        },
        {
            name: "keyUsage",
            digitalSignature: true,
            keyEncipherment: true
        }
    ]);

    cert.sign(cert.privateKey);

    return {
        cert: pki.certificateToPem(cert),
        key: pki.privateKeyToPem(cert.privateKey)
    };
}
