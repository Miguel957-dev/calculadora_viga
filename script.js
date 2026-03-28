function calcular() {
    let L = parseFloat(document.getElementById("L").value);
    let q = parseFloat(document.getElementById("q").value);
    let fck = parseFloat(document.getElementById("fck").value);
    let bw = parseFloat(document.getElementById("bw").value);
    let h = parseFloat(document.getElementById("h").value);
    let tipo = document.getElementById("tipo").value;

    if (isNaN(L) || isNaN(q) || isNaN(fck) || isNaN(bw) || isNaN(h)) {
        alert("Preencha todos os campos!");
        return;
    }

    // CONVERSÃO cm → m
    bw = bw / 100;
    h = h / 100;

    // ALTURA ÚTIL
    let d = 0.9 * h;

    // CÁLCULO DO MOMENTO
    let momento;
    if (tipo === "balanco") {
        momento = (q * L * L) / 2;
    } else {
        momento = (q * L * L) / 8;
    }

    let reacao;

    if (tipo === "balanco") {
        reacao = q * L;
    } else {
        reacao = (q * L) / 2;
    }

    // RESISTÊNCIA DO CONCRETO
    let fcd = fck / 1.4;
    let fcd_kN = fcd * 1000;

    // MOMENTO RESISTENTE
    let Mres = 0.27 * fcd_kN * bw * d * d;

    // ÍNDICE
    let indice = momento / Mres;

    let status = "";
    if (indice < 0.6) {
        status = "✅ Seguro";
    } else if (indice < 1.0) {
        status = "⚠️ Atenção";
    } else {
        status = "❌ Crítico";
    }

    // 🔥 CÁLCULO DO AÇO
    let fyd = 435; // MPa

    let M_Nmm = momento * 1000000; // kN·m → N·mm
    let d_mm = d * 1000;

    let As = M_Nmm / (0.87 * fyd * d_mm); // mm²
        // 🔩 BITOLAS DISPONÍVEIS
    let bitolas = [
        {diametro: 6.3, area: 31.2},
        {diametro: 8, area: 50.3},
        {diametro: 10, area: 78.5},
        {diametro: 12.5, area: 122.7},
        {diametro: 16, area: 201.1}
    ];

    let sugestao = "";

    // 🔍 ENCONTRAR MELHOR COMBINAÇÃO
    for (let i = 0; i < bitolas.length; i++) {
        let barra = bitolas[i];

        let quantidade = Math.ceil(As / barra.area);

        if (quantidade <= 10) { // limite simples pra não sugerir absurdo
            sugestao = quantidade + " barras de Ø" + barra.diametro + " mm";
            break;
        }
    }
    // POSIÇÃO DO AÇO
    let posicao;
    if (tipo === "balanco") {
        posicao = "Aço na parte SUPERIOR da viga";
    } else {
        posicao = "Aço na parte INFERIOR da viga";
    }

    document.getElementById("resultado").innerHTML =
    "Momento: " + momento.toFixed(2) + " kN·m <br>" +
    "Reação: " + reacao.toFixed(2) + " kN <br><br>" +
    "Momento resistente: " + Mres.toFixed(2) + " kN·m <br>" +
    "Índice: " + indice.toFixed(4) + "<br>" +
    "Status: " + status + "<br><br>" +
    "Área de aço (As): " + As.toFixed(2) + " mm² <br>" +
    posicao + "<br>" +
    "Sugestão: " + sugestao + "<br>";
}

function gerarPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // ===== DADOS =====
        let L = parseFloat(document.getElementById("L").value);
        let q = parseFloat(document.getElementById("q").value);
        let fck = parseFloat(document.getElementById("fck").value);
        let bw = parseFloat(document.getElementById("bw").value);
        let h = parseFloat(document.getElementById("h").value);
        let tipo = document.getElementById("tipo").value;

        bw = bw / 100;
        h = h / 100;
        let d = 0.9 * h;

        let momento = (tipo === "balanco") 
            ? (q * L * L) / 2 
            : (q * L * L) / 8;

        let fcd = fck / 1.4;
        let fcd_kN = fcd * 1000;
        let Mres = 0.27 * fcd_kN * bw * d * d;

        let fyd = 435;
        let M_Nmm = momento * 1000000;
        let d_mm = d * 1000;
        let As = M_Nmm / (0.87 * fyd * d_mm);

        // ===== HEADER =====
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 25, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("INFRACORE - Relatório Estrutural", 20, 15);

        doc.setTextColor(0, 0, 0);

        // ===== TABELAS (SEGURAS) =====
        if (doc.autoTable) {
            doc.autoTable({
                startY: 35,
                head: [["Parâmetro", "Valor"]],
                body: [
                    ["Comprimento (L)", L + " m"],
                    ["Carga (q)", q + " kN/m"],
                    ["fck", fck + " MPa"],
                    ["bw", bw + " m"],
                    ["h", h + " m"],
                    ["Tipo", tipo]
                ]
            });

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [["Resultado", "Valor"]],
                body: [
                    ["Momento", momento.toFixed(2) + " kN·m"],
                    ["fcd", fcd.toFixed(2) + " MPa"],
                    ["Momento resistente", Mres.toFixed(2) + " kN·m"],
                    ["Área de aço", As.toFixed(2) + " mm²"]
                ]
            });
        } else {
            doc.text(`Momento: ${momento.toFixed(2)} kN·m`, 20, 50);
            doc.text(`Área de aço: ${As.toFixed(2)} mm²`, 20, 60);
        }

        // ===== POSIÇÃO SEGURA DO Y =====
        let yBase = doc.lastAutoTable ? doc.lastAutoTable.finalY : 80;

        // ===== DIAGRAMA =====
        let y = yBase + 25;

        doc.setFontSize(12);
        doc.text("Diagrama de Momento Fletor", 60, 180);

        y += 10;

        let x0 = 30;
        let x1 = 180;

        doc.line(x0, y, x1, y);

        let prevX, prevY;

        for (let i = 0; i <= 50; i++) {
            let x = x0 + (i / 50) * (x1 - x0);
            let t = (x - x0) / (x1 - x0);

            let yOffset = (tipo === "biapoiada")
                ? -40 * (4 * t * (1 - t))
                : -40 * (t * t);

            if (i > 0) {
                doc.line(prevX, prevY, x, y + yOffset);
            }

            prevX = x;
            prevY = y + yOffset;
        }

        // ===== AVISO GRANDE =====
        let avisoY = 250;

        doc.setFillColor(255, 230, 230);
        doc.rect(15, avisoY - 10, 180, 20, "F");

        doc.setTextColor(200, 0, 0);
        doc.setFontSize(10);

        doc.text(
            "ATENÇÃO: Este relatório é apenas para fins educacionais e de pré-dimensionamento.",
            20,
            avisoY,
            { maxWidth: 170 }
        );

        doc.text(
            "Os resultados NÃO substituem um projeto estrutural conforme normas técnicas.",
            20,
            avisoY + 6,
            { maxWidth: 170 }
        );

        doc.text(
            "É obrigatória a validação por profissional habilitado.",
            20,
            avisoY + 12,
            { maxWidth: 170 }
        );

        // 🔥 ESSENCIAL (AGORA VAI FUNCIONAR)
        doc.save("relatorio_infracore.pdf");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar PDF. Veja o console (F12).");
    }
}
