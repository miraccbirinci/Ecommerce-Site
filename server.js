/**
 * İki tür request kullandık burada
 * GET: genellikle sunucudan istenen veriyi almak için kullanılır.
 * POST: sunucuya veri yollanması için kullanılır çoğunlukla body denilen bir pakete sahiptir ve
 * gönderilmek istenen veriler body e eklenerek göderilir.
 */
const express = require('express');
const app = express();
const port = 5000; // Hangi portta calisacagini belirledik
const url = require('url'); /*Requestte gelen url üzerinde işlem yapabilmek için ekledik
item seçerken urlde yollanan idyi alabilmek için kullanıdık*/

const session = require('express-session');//Session oluşturmak için ekledik.

var path = require('path');//Dosya yollarında kullanmak için ekledik.

/**
 * Handlebars (bir templating engine) daha dinamik web sayfaları oluşturmak için kullanılır. '.hbs' uzantılı dosyalar ile html şablonları oluşturulur ve kullanılır.
 * Bu dosyaların içinde html kodları bulunur buna ek  olarak bazı değişkenler kullanılır.
 * Değişkenlerin durumuna göre (genellikle {{degiskenadi}} kullanılır) html kodu dinamik olarak dönüştürülür.
 * 'if' ile koşul belirten durumlarda (değişken durumuna göre bir html elementini göstermek olabilir)
 * 'each' ile de döngü gerektiren durumlarda (bir array kullanarak ile html tablosu oluşturmak gibi) Handlebars pratiklik sağlar.
 */
var expressHandlebars = require('express-handlebars');

/** Post requestte gelen bodyi kullanabilmek için aşağıdaki iki satırı yazdım */
const bodyParser = require('body-parser');
const urlEncoded = bodyParser.urlencoded({ extended: false });

//MongoDB yi kullanmak için
var mongo = require('mongodb').MongoClient;

app.listen(port, () => console.log("Server Started"));//Sunucunun çalışır durumda olduğunu yazdırır.

//Oluşturulan session özelliklerini burada tanımladık.
//kullanıcı sessionları sunucu tarafında tutulur ilk session oluşturulduğunda kullanıcının tarayıcısına bir sessionkey verilir. Sessionkey her kullanıcı için farklıdır.
app.use(session({
    secret: 'secret-key',//Session key oluşturulurken kullanılacak şifreleme parametresi 'secret-key yerine istenen değer verilerbilir.'
    resave: false,
    saveUninitialized: true
}));

//Handlebars configurations
app.set('views', path.join(__dirname, '/'));//kullanılacak şablon dosyaların hangi dosya yolunda olacağını belirtiyoruz. Bu durumda hemen proje klösürünün altında '__dirname' -> projenin bulunduğu klasör
app.engine('hbs', expressHandlebars({ extname: '.hbs' }));//.hbs uzantılı dosyaların kullanılacağını belirityoruz templating engine oluşturuyoruz.
app.set('view engine', 'hbs');//Projenin kullanıcağı templating engine i belirtiyoruz.

app.get('/', (req, res) => {

    var barUsername;//Ekranın sağüstünde gösterilecek kullanıcı adı parametresi
    if (req.session.username) {//kullanıcının session ı varsa yani daha önce girişi yapmışsa
        barUsername = req.session.username;//sessiondaki kullanıcı adını parametreye atıyoruz.
    } else {
        barUsername = 'Not Logged In'//session yoksa sağ yukarıda yazacak yazı
    }
    res.render('index', { username: barUsername, isNotLoggedIn: !req.session.username })//index isimli template i (index.hbs) gösterilecek parametrelerini de vererek gösteriyoruz.
    //Kullanıcı adını login ve register hariç her sayfada sağ üstte göstereceğimiz için.
});

app.get('/login', (req, res) => res.sendFile(__dirname + "/login.html"));// localhost:5000/login urlsine yönlendirildiğinde login.html yi gösterir.
app.get('/register', (req, res) => res.sendFile(__dirname + "/register.html"));// localhost:5000/register urlsine yönlendirildiğinde register.html yi gösterir.
app.get('/products', (req, res) => {
    /**
     * MongoDB bağlantısı oluşturup 'AdvancedProgrammingDB' veritabanı içindeki 'Products' daki verilerin hepsini çekip 
     * kullanıcıya ürün isimlerini göstermek için template i parametleri ile beraber gönderiyoruz.
     */
    mongo.connect('mongodb://localhost:27017/', function (err, db) {
        if (err) {
            console.log(err);
        } else {
            db.db('AdvancedProgrammingDB').collection('Products').find({}).toArray(function (err, result) {
                if (err) throw err;
                console.log(result);
                var barUsername;
                var isLoggedIn;
                if (req.session.username) {
                    barUsername = req.session.username;
                    isLoggedIn = true;
                } else {
                    barUsername = 'Not Logged In';
                    isLoggedIn = false;
                }
                res.render('userindex', { username: barUsername, products: result, isLoggedIn: isLoggedIn })
            });
        }

    });

});// localhost:5000/products urlsine yönlendirildiğinde userindex.html yi gösterir.

app.post('/register', urlEncoded, (req, res) => {
    /**
     * register için göderilen post requestdeki bodydeki(req.body) username ve password ve pw_again alanlarını  new_credential isimli nesnede paketledik.
     * bu veriler register.htmldeki formdan geliyor sonra girilen kullanıcı adı alınmış mı alanlara boş veri girilmiş mi ve
     * girilen şifre ve şifre tekrarı uyuşuyor mu kontrolleri yapıyoruz.
     * eğer yukarıdaki koşullardan birinde sorun olursa tekrar register.html yi gösteriyoruz
     * eğer her şey olması gerektiği ise user_credentials dosyasına yeni kullanıcıyı ekleyip kaydediyoruz ve 
     * login sayfasına giriş yapması için gönderiyoruz.
     * 
     */
    new_credential = {
        username: req.body.username,
        password: req.body.password,
        pw_again: req.body.pw_again
    }
    
    mongo.connect('mongodb://localhost:27017/', function (err, db) {
        if (err) {
            console.log(err);
        } else {
            db.db('AdvancedProgrammingDB').collection('Users').findOne({ username: new_credential.username }, function (err, result) {
                var isTakenUsername = false;
                if (err) throw err;
                console.log(result);
                if (result) {
                    isTakenUsername = true;

                }
                //girilen kullanıcı adı alınmış mı
                if ((new_credential.username == "") || (new_credential.password == "") || (new_credential.pw_again != new_credential.password) || isTakenUsername) {
                    res.sendFile(__dirname + "/register.html");
                } else {
                    db.db('AdvancedProgrammingDB').collection('Users').insertOne({ username: new_credential.username, password: new_credential.password }, function (err, res) {
                        if (err) throw err;
                        console.log("1 document inserted");
                        db.close();
                    });//yeni kullanıcıyı ekleyip kaydediyoruz

                    res.redirect("/login");// logine yönlendir.
                }
            });
        }

    });

})
app.post('/login', urlEncoded, (req, res) => {
    /**
     * login için göderilen post requestdeki bodydeki(req.body) username ve passwordu credential isimli nesnede paketledik.
     * check_login fonksiyonuna username ve passwordu vererek bize gönderilen değerlerde kullanıcı olup olmadığına bakıyoruz
     * eğer varsa giriş yapabilmiş demektir userindex.html i gösteriyoruz.
     * eğer yoksa login.html i tekrar gösteriyoruz
     * 
     */
    credential = {
        username: req.body.username, password: req.body.password
    }
    mongo.connect('mongodb://localhost:27017/', function (err, db) {
        if (err) {
            console.log(err);//İşlem sırasında hata oluşursa yazdır.
        } else {
            //DB de girilen değerlere sahip kullanıcı var mı
            db.db('AdvancedProgrammingDB').collection('Users').findOne({ username: credential.username, password: credential.password }, function (err, result) {
                if (err) throw err;
                console.log(result);
                if (result) {
                    req.session.username = result.username;
                    req.session.products = [];
                    res.redirect("/products");
                } else {
                    res.sendFile(__dirname + "/login.html");
                }
            });
        }

    });
})
app.get('/logout', (req, res) => {//Çıkış yapmak için session kapatılır.
    req.session.destroy();
    res.redirect('/');//index sayfasına yönlendir.
})
app.get('/item', (req, res) => {
    /** 
     * Gelen requestin linkini parçalarına ayırıyoruz.
    */
    var parts = url.parse(req.url, true);
    var id = parts.query.id;//parçalarda linkteki queryden id parametresinin değerini alıyoruz.

    //O id deki itemi ekranda gösteriyoruz.

    mongo.connect('mongodb://localhost:27017/', function (err, db) {
        if (err) {
            console.log(err);
        } else {
            db.db('AdvancedProgrammingDB').collection('Products').findOne({ id: id }, function (err, result) {//id ye göre ürünü çeker
                if (err) throw err;
                console.log(result);
                var barUsername;
                var isLoggedIn;
                if (req.session.username) {
                    barUsername = req.session.username;
                    isLoggedIn = true;
                } else {
                    barUsername = 'Not Logged In'
                    isLoggedIn = false;
                }
                res.render('item', { username: barUsername, product: result, isLoggedIn: isLoggedIn })//item templateine gerekli parametreleri vererek gösterir.
            });
        }

    });

})

app.get('/add', (req, res) => {

    var parts = url.parse(req.url, true);
    var id = parts.query.id;
    console.log(id)
    mongo.connect('mongodb://localhost:27017/', function (err, db) {
        if (err) {
            console.log(err);
        } else {
            db.db('AdvancedProgrammingDB').collection('Products').findOne({ id: id }, function (err, result) {//Sepete eklenen ürünü sessiondaki ürünler listesine ekler. 
                if (err) console.log(err);
                req.session.products.push(result);
                res.sendStatus(200);//200 Http Statüsü başarılı demektir. 
            });

        }
    });



})

app.get('/checkout', (req, res) => {//Alışveriş arabasına tıklandığında çalışır ve sepetteki listeleri düzenler

    var total = 0;

    var prods = req.session.products;

    var barUsername;
    var isLoggedIn;
    if (req.session.username) {
        barUsername = req.session.username;
        isLoggedIn = true;
    } else {
        barUsername = 'Not Logged In'
        isLoggedIn = false;
    }
    for (let prod of prods) {//Sepetteki ürünlerin toplam fiyatını hesaplar.
        total = total + parseInt(prod.price);
    }
    res.render('shoppingcart', { username: barUsername, products: prods, isLoggedIn: isLoggedIn, total: total });

})

app.get('/buy', (req, res) => {

    var prods = req.session.products;
    var counts = {};//Ürünlerden hangisinden sepete kaç tane eklenmiş onu tutacak liste kaç tane 
    var ids = [];//Sepetteki ürün idlerini tutar
    prods.forEach(function (x) {
        ids.push(x.id);
        if(counts[x.id] > 0){
            counts[x.id] = counts[x.id] + 1;
        }else{
            counts[x.id] = 1;
        }
    });
    console.log(counts);
    mongo.connect('mongodb://localhost:27017/', function (err, db) {
        if (err) {
            console.log(err);
        } else {
            db.db('AdvancedProgrammingDB').collection('Products').find({id: {$in: ids}}).toArray(function (err, result) {//DBdeki ürünleri çeker
                if (err) throw err;
                console.log(result);
                for(let prod of result){//Ürün quantity sini sepetteki o ürünün miktarı kadar azaltır.
                    if(prod.quantity - counts[prod.id] >= 0){
                        prod.quantity = prod.quantity - counts[prod.id];
                    }
                    db.db('AdvancedProgrammingDB').collection('Products').updateOne({id: prod.id}, {$set: {"quantity": prod.quantity}});
                    //Yeni verileri DBde günceller.
                }
                
            });
        }
    })
    req.session.products = [];//sepet boşaltılır.
    res.redirect('/');//index sayfasına yönlendirir.

})
