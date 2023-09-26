// Подключаем необходимые модули и переменные
const axios = require('axios')
const ruLang = require('#src/utils/ru_lang')  // Локализация сообщений
const { sendToLog } = require('#src/utils/ProcessingLog') // Добавление лога
const { resetFlags } = require('#src/utils/ProcessingHelpers')
const { checkUser } = require('#src/api/users')
// const { handleTextCommand } = require('#src/modules/text')  // Обработка текстовых сообщений

// Функция для проверки, зарегистрирован ли пользователь на сервере
async function checkRegistration(chatId) {
    try {
        const response = checkUser()
        return {
            exists: response.exists === true,
            fio: response.fio,
        }
    } catch (error) {
        await bot.telegram.sendMessage(LOG_CHANNEL_ID, `reg <code>${error}</code>`, { parse_mode: 'HTML' })
        return { exists: false, fio: null }
    }
}

// Асинхронная функция для обработки команды регистрации
async function handleRegComment(ctx) {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    resetFlags(ctx)
    const chatId = ctx.message.chat.id
    const { chat } = ctx.message

    const registrationData = await checkRegistration(chatId)
    const isRegistered = registrationData.exists
    const fio = registrationData.fio

    let textToReply
    if (isRegistered && fio) {
        textToReply = `<code>${fio}</code> <b>Вы уже зарегистрированы!</b>`
    } else {
        textToReply = ruLang.notRegistered
    }
    ctx.session.isAwaitFio = !isRegistered

    // Отправляем сообщение
    ctx.reply(textToReply, { parse_mode: 'HTML' })
}

module.exports = { handleRegComment }