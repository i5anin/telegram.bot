// Загрузка переменных среды из .env файла
require('dotenv').config()
const { Telegraf } = require('telegraf')
const LocalSession = require('telegraf-session-local')
const io = require('@pm2/io')
const fs = require('fs')
const path = require('path')

// включить отслеживание транзакций
// включить метрики веб-сервера (необязательно)
io.init({ transactions: true, http: true })

// Импорт модулей
const { initCronJobs } = require('#src/modules/cron')
const { handleRegComment } = require('#src/modules/reg')
const { handleTextCommand } = require('#src/modules/text')
const { handleHelpCommand, handleDocsCommand } = require('#src/modules/help')
const { oplataNotification } = require('#src/modules/oplata')
const { notifyUsers, notifyAllUsers } = require('#src/modules/notify')
const { handleStatusCommand, handleMsgCommand } = require('#src/utils/admin')
const { logNewChatMembers, logLeftChatMember } = require('#src/utils/log')
const { handleGetGroupInfoCommand } = require('#src/utils/csv')
const { runBot } = require('#src/modules/runBot')
const { handleForwardedMessage, whoCommand } = require('#src/modules/who')
const { createMetric } = require('#src/utils/metric')

// Конфигурационные переменные
const { BOT_TOKEN } = process.env

// Инициализация Telegraf бота
const bot = new Telegraf(BOT_TOKEN)

// Инициализация сессии
const localSession = new LocalSession({ database: 'session_db.json' })
bot.use(localSession.middleware())

// Сессионный middleware
bot.use((ctx, next) => {
    ctx.session = ctx.session || { fileId: false, isAwaitFio: false, isAwaitComment: false, isUserInitiated: false }
    return next()
})


// Глобальные переменные
global.SECRET_KEY = process.env.SECRET_KEY
global.WEB_API = 'https://bot.pf-forum.ru/api'

global.GRAND_ADMIN = process.env.GRAND_ADMIN
global.LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID
global.DIR_OPLATA = process.env.DIR_OPLATA
global.OPLATA_GROUP = process.env.OPLATA_GROUP
global.OPLATA_REPORT_ACTIVE = process.env.OPLATA_REPORT_ACTIVE //OPLATA_REPORT_ACTIVE = true;
global.MODE = process.env.NODE_ENV || 'development'  // Если NODE_ENV не определен, по умолчанию используется 'development'
global.emoji = {
    x: '&#10060;', ok: '&#9989;', error: '&#10071;', warning: '&#x26A0;', bot: '&#129302;', star: '&#11088;',
}   //❌ //✅ //❗ //⚠ //🤖 //⭐

global.bot = bot
global.stateCounter = {
    bot_update: 0,
    bot_check: 0,

    user_get_all: 0,
    users_get: 0,
    users_get_all_fio: 0,
    users_add: 0,

    comment_get_all: 0,
    comment_update: 0,

    oplata_get_all: 0,
    oplata_update: 0,
}

// Случайный номер экземпляра
const instanceNumber = Math.floor(Math.random() * 9000) + 1000
const currentDateTime = new Date()

runBot(instanceNumber, currentDateTime)
// Обработчики команд
bot.command('reg_key', (ctx) => handleRegComment(ctx, ctx.session.isAwaitFio = true)) //['start', 'reg']
bot.command('new_comment', (ctx) => notifyUsers(ctx, ctx.session.isUserInitiated = true))
bot.command('new_comment_all', notifyAllUsers)
bot.command('help', handleHelpCommand)
bot.command('oplata', oplataNotification)
bot.command('msg', handleMsgCommand)
bot.command('status', (ctx) => handleStatusCommand(ctx, instanceNumber, currentDateTime))
bot.command('get_group_info', (ctx) => handleGetGroupInfoCommand(ctx))
bot.command('who', (ctx) => whoCommand(ctx))
bot.command('docs', (ctx) => handleDocsCommand(ctx))


bot.on('message', async (ctx) => {
    console.log('Message received:', ctx.message) //для логирования
    if (ctx.message.photo) {
        console.log('Фотография получена!')
        const fileId = ctx.message.photo[0].file_id
        ctx.session.fileId = true

        // Получить информацию о файле
        const file = await bot.telegram.getFile(fileId)
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`

        // Скачать и сохранить файл
        const response = await axios.get(fileUrl, { responseType: 'stream' })
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
        const filePath = path.join(photoDir, `${timestamp}.jpg`)
        const writer = fs.createWriteStream(filePath)
        response.data.pipe(writer)

        ctx.reply('Пожалуйста, пришлите мне подпись:')
        await handleTextCommand(ctx)
    } else if (ctx.message.forward_from) {
        handleForwardedMessage(ctx)
    } else {
        handleTextCommand(ctx)
    }
})
//bot.on('text', (ctx) => handleTextCommand(ctx)) // особо не нужна но пусть будет

// Обработчик текстовых сообщений
bot.on('new_chat_members', logNewChatMembers)
bot.on('left_chat_member', logLeftChatMember)

// Проверка и создание директорий
const photoDir = path.join(__dirname, 'photos')
const textDir = path.join(__dirname, 'texts')

if (!fs.existsSync(photoDir)) {
    fs.mkdirSync(photoDir)
}

if (!fs.existsSync(textDir)) {
    fs.mkdirSync(textDir)
}
const axios = require('axios')


// Запуск бота
bot.launch().catch((err) => {
    console.error('Fatal Error! Error while launching the bot:', err)
    setTimeout(() => bot.launch(), 30000) // Попробовать перезапустить через 30 секунд
})

createMetric('bot_check', stateCounter, 'bot_check')
createMetric('user_get_all', stateCounter, 'user_get_all')
createMetric('users_get_all_fio', stateCounter, 'users_get_all_fio')
createMetric('user_add', stateCounter, 'user_add')
createMetric('users_get', stateCounter, 'users_get')
createMetric('comment_get_all', stateCounter, 'comment_get_all')
createMetric('comment_update', stateCounter, 'comment_update')
createMetric('oplata_get_all', stateCounter, 'oplata_get_all')
createMetric('oplata_update', stateCounter, 'oplata_update')

// Инициализация cron-заданий
initCronJobs(currentDateTime, instanceNumber)
