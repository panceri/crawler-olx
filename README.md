# crawler-olx
Um exemplo de um crawler para extrair imóveis a venda do site OLX.

Para rodar:

1. Clone o repositório localmente
2. Instale o [RethinkDB](https://www.rethinkdb.com/docs/install/)
3. Instale o [Redis](http://redis.io/download)
4. Rode o npm install para instalar as dependências
5. Rode o arquivo app.js //node app.js

Ao acessar o dashboard do RethinkDB é possível ver a gravação dos dados na tabela imoveis através de gráficos. 
Para visualizar os dados gravados na tabela rode a query:
``r.table('imoveis').limit(3) ``



