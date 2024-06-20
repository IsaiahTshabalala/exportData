function getRandomChars(numChars = 1) {
    const chars = '01234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numChars < 1 || numChars > chars.length)
        throw('Parameter numChars is out of bounds');
    let randomChars = '';
    for (let idx = 0; idx < numChars; idx++) {
        const randNum = Math.trunc(Math.random() * 10000000000) % chars.length; // A random number from 0 to chars.length - 1
        randomChars += chars[randNum];
    }
    return randomChars;
}


for (let i = 0; i < 20; i++)
    console.log(getRandomChars(3));