require('dotenv').config();
const express = require('express');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

const ZINDEXING_TOKEN = process.env.ZINDEXING_TOKEN;
if (!ZINDEXING_TOKEN) {
  console.warn('Aviso: ZINDEXING_TOKEN não definido. Defina-o em .env ou no ambiente.');
}

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.post('/api/index', async (req, res) => {
  const { url, urls } = req.body;
  const targets = Array.isArray(urls)
    ? urls.map(String).map((u) => u.trim()).filter(Boolean)
    : typeof url === 'string' && url.trim()
    ? [url.trim()]
    : [];

  if (!ZINDEXING_TOKEN) {
    return res.status(500).json({ error: 'Token de indexação não configurado no servidor.' });
  }

  if (targets.length === 0) {
    return res.status(400).json({ error: 'Pelo menos uma URL é obrigatória.' });
  }

  try {
    const results = [];

    for (const targetUrl of targets) {
      const payload = {
        urls: [targetUrl],
      };

      try {
        console.log('[zindexing] payload enviado:', JSON.stringify(payload));
        const response = await fetch('https://zindexing.com/v1/boost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ZINDEXING_TOKEN}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('[zindexing] resposta HTTP', response.status, ':', JSON.stringify(data));
        results.push({
          url: targetUrl,
          ok: response.ok,
          status: response.status,
          timestamp: new Date().toLocaleString('pt-BR'),
          body: data,
        });
      } catch (error) {
        results.push({
          url: targetUrl,
          ok: false,
          status: 0,
          timestamp: new Date().toLocaleString('pt-BR'),
          error: error.message,
        });
      }
    }

    return res.json({ results });
  } catch (error) {
    console.error('Erro ao processar requisição de indexação:', error);
    return res.status(500).json({ error: 'Falha ao enviar a requisição para zindexing.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor iniciado em http://localhost:${port}`);
});
