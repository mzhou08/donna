export const sendMessage = async (chatId: string, message: string) => {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?text=${message}&chat_id=${chatId}`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
}