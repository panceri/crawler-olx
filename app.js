var request = require('request');
var cheerio = require('cheerio');
var r = require('rethinkdb');
var redis = require("redis");
var client = redis.createClient();

var imoveis = 0;
var links = 0;
var totalPages = 0;
var qtdInserts = 0;

function scrap(url){
    request(url, parseRequest);    
}

client.on("error", function (err) {
    console.log("Error " + err);
});



function parseRequest(error, response, html){
    if (error) console.log(error);
    if (!error){
        var $ = cheerio.load(html);
        if ($){
            if ($('.page_OLXad-view')){
                imoveis++;
                var imovel = {};
                imovel.title = $('#ad_title').text().trim();
                imovel.preco = $('.actual-price').text().trim();
                imovel.description = $('.OLXad-description > p').text().trim();
                imovel.fotos = [];

                if (response.href) imovel.url = response.href;

                $('.photos > .scrollable > ul > li .box-image > a').each(function(index, a){
                    imovel.fotos.push($(a).attr('href'));
                });

                if ($('.OLXad-details')){
                    imovel.detalhe = {};
                    $('.OLXad-details > div > ul > li > p').each(function(index, p){
                        var key, value;
                        key = $(p).find('span').text().trim();
                        value = $(p).find('strong').text().trim();
                        imovel.detalhe[key] = value;
                    });
                }

                if ($('.OLXad-location')){
                    imovel.localizacao = {};    
                    $('.OLXad-location > div > ul > li > p').each(function(index, p){
                        var key, value;
                        key = $(p).find('span').text().trim();
                        value = $(p).find('strong').text().trim();
                        imovel.localizacao[key] = value;
                    });
                }

                if (imovel.title.length > 0){
                    r.table('imoveis').insert(imovel).run(connection, function(err, result){
                         if (err) console.log(err);
                         qtdInserts++;
                    });
                }
            }

            if ($('.section_OLXad-list')){
                $('.section_OLXad-list').find('a').each(function(index, a) {
                    var toQueueUrl = $(a).attr('href').trim();
                    if (toQueueUrl){
                        links++;
                        client.get(toQueueUrl, function(err, reply) {
                            //console.log(toQueueUrl);
                            if (!err){
                                client.set(toQueueUrl, "OK");
                                scrap(toQueueUrl);
                            }else{
                                console.log(err);
                                process.exit();
                            }
                        });
                    }
                });
            }

            /*if ($('.module_pagination > ul > li.next > a')){
                $('.module_pagination > ul > li.next > a').each(function(index, a){
                    var toQueueUrl = $(a).attr('href').trim();
                    client.get(toQueueUrl, function(err, reply) {
                        console.log(toQueueUrl);
                        if (!reply){
                            console.log(toQueueUrl);
                            totalPages+=1;
                            client.set(toQueueUrl, "OK", redis.print);
                            scrap(toQueueUrl);
                        }
                    });
                });
            }*/
        }else{
            console.log("caralho");
        }
    }
}

var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) console.log(err);
    connection = conn;
        r.db('test').tableCreate('imoveis').run(connection, function(err, result) {
        if (err) console.log(err);
        r.table("imoveis").indexCreate("url").run(connection, function(err, result){
            if (err) console.log(err);
            r.table("imoveis").indexWait("url").run(connection, function(err, result){
                if (err) console.log(err);
                var url = "http://sc.olx.com.br/imoveis/venda";
                scrap(url);
                for(var a = 0; a <= 2044; a++){
                    scrap(url + "?o=" + a);
                }

            });
        });
    });
});
