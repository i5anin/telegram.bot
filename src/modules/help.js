const fs = require('fs')
const { sendToLog } = require('#src/utils/log')
const { getAllUsers } = require('#src/api/index')
const { Markup } = require('telegraf')
const { checkRegistration } = require('#src/modules/reg')
const { logMessage } = require('#src/utils/ru_lang')


async function getUserInfo(userId) {
    try {
        // Запрашиваем данные всех пользователей
        const response = await getAllUsers()
        // Ищем пользователя с заданным userId в полученных данных
        const user = response.find(u => u.user_id === userId)  // Изменили response.users_data на response
        if (user) {// Если пользователь найден, возвращаем его данные
            return { userId: user.user_id, fio: user.fio }
        } else {// Если пользователь не найден, выбрасываем ошибку или возвращаем undefined/null
            throw new Error('User not found')
        }
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error)
        throw error
    }
}


async function handleHelpCommand(ctx) {
    await sendToLog(ctx)

    // Получаем аргументы после команды
    const input = ctx.message.text.split(' ')
    const userId = input[1] ? parseInt(input[1]) : null

    // Проверяем, является ли отправитель администратором и был ли предоставлен аргумент
    if (userId && String(ctx.from.id) === GRAND_ADMIN) {
        try {
            await sendHelpToUser(ctx, userId)

            // Получаем информацию о пользователе с помощью функции getUserInfo
            const user = await getUserInfo(userId)

            // Отправляем сообщение администратору с информацией о пользователе
            await ctx.reply(`Сообщение отправлено пользователю\nID: <code>${user.userId}</code>\nФИО: <code>${user.fio}</code>`, { parse_mode: 'HTML' })

        } catch (err) {
            // Проверяем, является ли ошибка ошибкой Telegram
            if (err.response && err.response.error_code === 400 && err.response.description === 'Bad Request: chat not found') {
                await ctx.reply('Не удалось отправить сообщение пользователю. Чат не найден.')
            } else {
                // Если это другой тип ошибки, выводим ее в консоль и отправляем сообщение о неизвестной ошибке
                console.error('Error sending help to user:', err)
                await ctx.reply(`Произошла неизвестная ошибка.\n<code>${err}</code>`, { parse_mode: 'HTML' })
            }
        }
    } else if (!userId) {
        // Если аргумент не предоставлен, отправляем справку отправителю
        await sendHelpToUser(ctx, ctx.chat.id)
    }
}


async function sendHelpToUser(ctx, chatId) {
    // Формируем и отправляем справку пользователю с указанным chatId
    const photo = fs.createReadStream('src/media/answer.jpg')
    const video = fs.createReadStream('src/media/answer.mp4') // Убедитесь, что путь к файлу верный
    const messageJpg = `Доступные команды:

1. /new_comment - Получить новые комментарии
${emoji.min_point} прокомментировать задачу через <u>ответить</u>
${emoji.min_point} телефон: <u>ответить</u> - долгое нажатие на нужном сообщении
${emoji.min_point} пк: правой кнопкой мыши <u>ответить</u>

2. /docs - Посмотреть полезные документы

Для регистрации подойдите в отдел <b>IT</b>

В случае ошибки напишите разработчику @i5anin Сергей.`

    await ctx.telegram.sendPhoto(chatId, { source: photo }, {
        caption: messageJpg,
        parse_mode: 'HTML',
    })

    // Отправка видео
    await ctx.telegram.sendVideo(chatId, { source: video })
}

async function handleDocsCommand(ctx) {
    await sendToLog(ctx)
    const chatId = ctx.message.chat.id  // Получение chatId из контекста ctx
    try {
        const registrationData = await checkRegistration(chatId)  // Проверка регистрации
        const isRegistered = registrationData.exists

        if (isRegistered) {  // Если пользователь зарегистрирован
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url('Общая штатная папка', 'https://drive.google.com/drive/folders/1y5W8bLSrA6uxMKBu_sQtJp7simhDExfW')],
                [Markup.button.url('Должностная папка оператора', 'https://drive.google.com/drive/folders/1ZmouCoENMzQ7RZxhpmAo-NeZmAanto0V')],
                [Markup.button.url('СОФТ (Локально)', 'http://eml.pfforum/')],
                [Markup.button.url('Архив собраний', 'https://disk.yandex.ru/d/ajVEHCmS5s2T2A')],
            ])

            await ctx.reply('Вот несколько полезных ссылок:', keyboard)
        } else {  // Если пользователь не зарегистрирован
            await ctx.reply('Доступ закрыт.\nВы должны зарегистрироваться, чтобы получить доступ к этим ресурсам.')
        }
    } catch (error) {
        console.error('Ошибка при проверке регистрации:', error)
        await ctx.reply('Произошла ошибка при проверке регистрации. Пожалуйста, попробуйте позже.')
    }
}

module.exports = { handleHelpCommand, handleDocsCommand }
