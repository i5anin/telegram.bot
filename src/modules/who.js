const { getAllUsers, getChatInfo } = require('#src/api/index')
const msg = require('#src/utils/ru_lang')
const { logMessage } = require('#src/utils/ru_lang')


const handleForwardedMessage = async (ctx) => {
    if (!ctx.message.forward_from) return

    const res = ctx.message
    const userId = res.forward_from.id
    const username = res.forward_from.username
    const firstName = res.forward_from.first_name
    const lastName = res.forward_from.last_name

    try {
        const usersData = await getAllUsers()
        const user = usersData.find(u => u.user_id === userId)

        if (user) {
            const fullName = `${firstName || ''} ${lastName || ''}`.trim()
            await ctx.reply(`<b>Пользователь</b>\n` + logMessage(userId, user.fio, username, fullName), { parse_mode: 'HTML' })
        } else {
            await ctx.reply(msg.userNotFound(userId), { parse_mode: 'HTML' })
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}


async function whoCommand(ctx) {
    let targetId
    const input = ctx.message.text.split(' ')

    if (input[1]) {
        targetId = parseInt(input[1])
    } else {
        targetId = ctx.from.id
    }

    try {
        if (targetId < 0) {
            const chatInfo = await getChatInfo(targetId)

            if (chatInfo.type === 'channel') {
                await ctx.reply(`Название канала: <code>${chatInfo.title}</code>\nОписание: ${chatInfo.description}`, { parse_mode: 'HTML' })
            } else if (chatInfo.type === 'private') {
                await ctx.reply('Это приватный чат, информация недоступна.')
            } else {
                const membersCount = await ctx.getChatMembersCount(targetId)
                const administrators = await ctx.getChatAdministrators(targetId)

                const adminNames = administrators.map(admin =>
                    admin.user.first_name + (admin.user.last_name ? ' ' + admin.user.last_name : ''),
                ).join(', ')

                await ctx.reply(`Название группы: ${chatInfo.title}\n` +
                    `Количество участников: ${membersCount}\n` +
                    `Админы: ${adminNames}`)
            }
        } else {
            // Проверяем пользователя
            const usersData = await getAllUsers()
            const user = usersData.find(u => u.user_id === targetId)

            if (user) {
                await ctx.reply(`<b>Пользователь</b>\n` + logMessage(targetId, user.fio), { parse_mode: 'HTML' })
            } else {
                await ctx.reply(msg.userNotFound(targetId), { parse_mode: 'HTML' })
            }
        }
    } catch (error) {
        console.error(msg.errorAPI, error)
        await ctx.reply(msg.error)
    }
}


module.exports = { handleForwardedMessage, whoCommand }