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

    // 🔥 CÁLCULO DO AÇO CORRIGIDO
    let fyd = 435; // MPa (CA-50)

    // 1. Aplicar o coeficiente de segurança de 1.4 no momento
    let Md_Nm = (momento * 1.4) * 1000000; 

    // 2. Usar o 'd' que você já calculou lá em cima (convertido para mm)
    let d_mm = d * 1000; 

    // 3. Usar 0.80 para maior segurança em balanços
    let As = Md_Nm / (0.80 * fyd * d_mm); // mm²
    
    // 🔩 BITOLAS DISPONÍVEIS
    let bitolas = [
        {diametro: 6.3, area: 31.2},
        {diametro: 8, area: 50.3},
        {diametro: 10, area: 78.5},
        {diametro: 12.5, area: 122.7},
        {diametro: 16, area: 201.1}
    ];

    let sugestao = "Necessário bitola maior que 16mm"; // Mensagem padrão caso passe de 10 barras

    // 🔍 ENCONTRAR MELHOR COMBINAÇÃO
    for (let i = 0; i < bitolas.length; i++) {
        let barra = bitolas[i];
        let quantidade = Math.ceil(As / barra.area);

        if (quantidade <= 10) { 
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

        // 1. CAPTURA DE DADOS
        let L = parseFloat(document.getElementById("L").value);
        let q = parseFloat(document.getElementById("q").value);
        let fck = parseFloat(document.getElementById("fck").value);
        let bw = parseFloat(document.getElementById("bw").value);
        let h = parseFloat(document.getElementById("h").value);
        let tipo = document.getElementById("tipo").value;

        // 2. CONVERSÕES E CÁLCULOS TÉCNICOS
        let bw_m = bw / 100;
        let h_m = h / 100;
        let d_m = 0.9 * h_m; 
        let d_mm = d_m * 1000;

        let momento = (tipo === "balanco") ? (q * L * L) / 2 : (q * L * L) / 8;
        let fcd = fck / 1.4;
        let fcd_kN = fcd * 1000;
        let Mres = 0.27 * fcd_kN * bw_m * d_m * d_m;

        // CÁLCULO DO AÇO COM SEGURANÇA (1.4 e 0.80)
        let fyd = 435; 
        let Md_Nmm = (momento * 1.4) * 1000000; 
        let As = Md_Nmm / (0.80 * fyd * d_mm);

        // 3. HEADER DO PDF
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 25, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text("INFRACORE - Relatório Estrutural", 20, 15);

        // 4. TABELAS DE DADOS E RESULTADOS
        doc.setTextColor(0, 0, 0);
        if (doc.autoTable) {
            doc.autoTable({
                startY: 35,
                head: [["Parâmetro de Entrada", "Valor"]],
                body: [
                    ["Comprimento (L)", L + " m"],
                    ["Carga (q)", q + " kN/m"],
                    ["Resistência (fck)", fck + " MPa"],
                    ["Largura (bw)", bw + " cm"],
                    ["Altura (h)", h + " cm"],
                    ["Tipo de Estrutura", tipo === "balanco" ? "Balanço" : "Biapoiada"]
                ]
            });

            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [["Resultado do Dimensionamento", "Valor"]],
                body: [
                    ["Momento Fletor (Mk)", momento.toFixed(2) + " kN·m"],
                    ["Momento de Cálculo (Md)", (momento * 1.4).toFixed(2) + " kN·m"],
                    ["Momento Resistente", Mres.toFixed(2) + " kN·m"],
                    ["Área de Aço (As)", As.toFixed(2) + " mm²"]
                ]
            });
        }

        // 5. DIAGRAMA DE MOMENTO (O desenho da curva)
        let yBase = doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : 150;
        doc.setFontSize(12);
        doc.text("Diagrama de Momento Fletor (Esquemático)", 60, yBase - 10);
        
        let x0 = 30; // Início da viga no desenho
        let x1 = 180; // Fim da viga no desenho
        doc.setLineWidth(1);
        doc.line(x0, yBase, x1, yBase); // Linha da viga

        let prevX, prevY;
        doc.setDrawColor(200, 0, 0); // Cor vermelha para a curva
        for (let i = 0; i <= 50; i++) {
            let x = x0 + (i / 50) * (x1 - x0);
            let t = i / 50;
            let yOffset = (tipo === "biapoiada") ? -40 * (4 * t * (1 - t)) : -40 * (t * t);

            if (i > 0) doc.line(prevX, prevY, x, yBase + yOffset);
            prevX = x; 
            prevY = yBase + yOffset;
        }

        // 6. AVISO LEGAL (RODAPÉ)
        let avisoY = 260;
        doc.setFillColor(255, 230, 230);
        doc.rect(15, avisoY - 5, 180, 25, "F");
        doc.setTextColor(150, 0, 0);
        doc.setFontSize(9);
        doc.text("AVISO: Este documento é para fins de pré-dimensionamento educacional.", 20, avisoY + 5);
        doc.text("É obrigatória a assinatura de um Engenheiro Civil para execução da obra.", 20, avisoY + 12);

        // 7. SALVAR
        doc.save("Relatorio_Estrutural_Infracore.pdf");

    } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar o PDF. Verifique se preencheu os números corretamente.");
    }
}
