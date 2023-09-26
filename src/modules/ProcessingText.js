const ruLang = require('#src/utils/ru_lang')
const { fetchData } = require('#src/utils/ProcessingHelpers')
const { notifyUsers } = require('#src/modules/ProcessingNotify')
const { handleAddComment } = require('#src/modules/ProcessingComment')
const { sendToLog } = require('#src/utils/ProcessingLog')

async function handleTextCommand(ctx) {
    await sendToLog(ctx)
    if (ctx.chat.type !== 'private') return
    // Деструктуризация полей из сообщения
    const { text, chat, from } = ctx.message

    // Ранний выход для улучшения читаемости
    if (!ctx.session.isAwaitFio && !ctx.session.isAwaitComment && !ctx.message.reply_to_message) return

    // --------- Обработка ожидания ФИО ---------
    if (ctx.session.isAwaitFio && ctx.chat.type === 'private') {
        console.log('ctx.session.isAwaitFio=', ctx.session.isAwaitFio)
        if (!/^[А-Яа-яёЁëË]+\s[А-Яа-яёЁëË]\. ?[А-Яа-яёЁëË]\.$/.test(text)) { //налог с диакритическим знаком "ë"
            ctx.reply(ruLang.invalidData)
            return
        }
        // Дальнейшая логика обработки ФИО
        const cleanedText = text.replace(/ë/g, 'ё').replace(/Ë/g, 'Ё').replace(/\. /g, '.')
        const userId = chat.id

        // Запрос на добавление пользователя
        const dataAddUser = await addUser(userId, cleanedText, from.username)
        ctx.reply('Вы успешно зарегистрированы', { parse_mode: 'HTML' })
        const defMsg = `\nID: <code>${userId}</code>` +
            `\nfio: <code>${cleanedText}</code>`

        await bot.telegram.sendMessage(
            LOG_CHANNEL_ID, dataAddUser ? `${emoji.star}Пользователь добавлен.${defMsg}` : `⚠️Ошибка регистрации${defMsg}`,
            { parse_mode: 'HTML' },
        )

        await notifyUsers(ctx)
        ctx.session.isAwaitFio = false
    }

    // --------- Обработка ожидания комментария ---------
    if (ctx.message.reply_to_message) {
        await handleAddComment(ctx)
        console.log('Обработка ожидания комментария handleAddComment')
    }
}

module.exports = { handleTextCommand }
