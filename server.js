const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const axios = require('axios'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Senin RapidAPI Anahtarın
const RAPIDAPI_KEY = 'bfae6dff8bmsh210d0239e0b8f71p1e9fd9jsneea1614c3509'; 
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';

let sonTweetId = null;

io.on('connection', (socket) => {
    console.log('🦁 Yeni bir GS taraftarı siteye bağlandı!');
});

// Küresel Radarı Çalıştıran Fonksiyon
async function haberleriCek() {
    console.log("🌍 Küresel Radar çalıştı: Tüm muhabirler taranıyor...");
    try {
        const options = {
            method: 'GET',
            url: `https://${RAPIDAPI_HOST}/search.php`, 
            params: {
                // Buradaki listeye istediğin muhabirin Twitter kullanıcı adını "OR from:isim" şeklinde ekleyebilirsin
                query: 'Galatasaray (from:yagosabuncuoglu OR from:FabrizioRomano OR from:ertansuzgun OR from:Haluk_Yurekli OR from:AliNaciKucuk OR from:DiMarzio OR from:David_Ornstein OR from:Plettigoal OR from:MatteMoretto OR from:Santi_J_FM OR from:yakupcinar OR from:nevzatdindar)',
                search_type: 'Latest' // En yeni haberi (anlık) yakalamak için Latest yaptık
            },
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': RAPIDAPI_HOST
            }
        };

        const response = await axios.request(options);
        
        // Gelen verinin içinde tweetler varsa al
        if (response.data && response.data.timeline && response.data.timeline.length > 0) {
            const enYeniTweet = response.data.timeline[0]; 
            const tweetId = enYeniTweet.tweet_id;

            // Eğer bu haberi daha önce ekrana vermediysek
            if (tweetId !== sonTweetId) {
                sonTweetId = tweetId; 

                const yeniHaber = {
                    muhabir: enYeniTweet.user_info.name,
                    kullanici_adi: "@" + enYeniTweet.user_info.screen_name,
                    mesaj: enYeniTweet.text,
                    saat: new Date().toLocaleTimeString('tr-TR')
                };

                // Siteye anlık gönder
                io.emit('yeni_haber', yeniHaber); 
                console.log("🔥 YENİ HABER EKRANA DÜŞTÜ:", yeniHaber.mesaj);
            } else {
                console.log("Yeni haber yok, küresel radar dinlemede...");
            }
        }
    } catch (error) {
        console.log("Veri çekerken hata oluştu.");
        console.error("Hata Detayı:", error.message);
    }
}

// Sistemi her 1.5 dakikada bir kontrol etmeye ayarla (90000 milisaniye)
setInterval(haberleriCek, 90000); 

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 KÜRESEL RADAR BAĞLANDI! Tarayıcıda http://localhost:${PORT} adresine git.`);
    haberleriCek(); // Sunucu açılır açılmaz ilk kontrolü yap
});