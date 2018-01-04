const Telegraf = require('telegraf');
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const session = require('telegraf/session')

const console = require('tracer').colorConsole();

const config = require('config');
const express = require('express');
const bodyParser = require('body-parser');

const User = require('./lib/user');


const getUserFullName = (user) => {
    return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
}

const modifyPhoneNumber = (number) => {
    return number.replace(/^\+/, '')
}

let telegramApp = new Telegraf(config.token);
telegramApp.use(session())


telegramApp.command('start', (ctx) => {
    let text = `Добрый день, ${getUserFullName(ctx.from)}!\n` + 
               `Нажмите кнопку "Отправить номер" внизу, чтобы начать.`;

    let chatId = ctx.update.message.from.id;
    User.findOne({ chatId: chatId }).then((currentUser) => {
        if (!currentUser) {
            ctx.reply(text, Markup
                .keyboard([
                    Markup.contactRequestButton("Отправить номер")
                ])
                .oneTime(true)
                .resize(false)
                .extra()
            );
        } else {
            ctx.reply('Вы уже зарегистрированы.')
        }

    });
});

telegramApp.on('contact', (ctx) => {
    if (ctx.message.contact.user_id == ctx.from.id) {
        let newUser = new User({
            chatId: ctx.from.id,
            number: modifyPhoneNumber(ctx.message.contact.phone_number),
            title: getUserFullName(ctx.message.contact)
        });
        
        return newUser.save()
            .then(() => {
                ctx.reply('Все хорошо. Вы зарегистрированы.', Markup.removeKeyboard().extra());
            })
            .catch(console.log);
    } else {
        ctx.reply('Вероятно, это не ваш номер :(');
    }
});


telegramApp.startPolling();


let expressApp = express();

expressApp.set('views', __dirname + "/views");
expressApp.set('view engine', 'pug');

expressApp.get('/', (req, res) => {
    User.find({})
        .then((users) => {
            res.render('index', {users})
        })
        .catch((err) => {
            console.log(err)
            res.sendStatus(500)
        })

});

expressApp.post('/send/:number', bodyParser.json(), (req, res) => {
    let number = req.params.number
    User.findOne({number: number})
        .then((currentUser) => {
            console.log('req from', number)

            if (currentUser) {
                telegramApp.telegram.sendMessage(currentUser.chatId, req.body.text)
                res.sendStatus('200')
            } else {
                console.log('not found')
                res.sendStatus('404')
            }
        })
        .catch((err) => {
            console.log(err)
            res.sendStatus(500)
        }) 
    
});

expressApp.listen(config.port || 3000);