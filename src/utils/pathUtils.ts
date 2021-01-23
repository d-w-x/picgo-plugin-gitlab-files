import {IImgInfo} from "picgo/dist/src/types";
import crypto from "crypto";


/**
 * 路径替换
 * @param output 原始图片
 * @param originalPath 配置中的形式化路径
 * @param replaceSlash 是否替换/,如果是单文件,需要替换
 */
export function formatPath(output: IImgInfo, originalPath: string, replaceSlash: boolean): string {
    // 获取日期
    let date = new Date()

    // 格式化数据
    let formatData = {
        // 路径
        year: `${date.getFullYear()}`,
        month: date.getMonth() < 9 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`,
        day: `${date.getDate()}`,
        hour: `${date.getHours()}`,
        minute: `${date.getMinutes()}`,
        second: `${date.getSeconds()}`,
        milliseconds: `${date.getMilliseconds()}`,

        // 文件名
        fileName: output.fileName.replace(output.extname, ''),
        hash16: crypto.createHash('md5').update(output.base64Image ? output.base64Image : output.buffer.toString()).digest('hex').substr(0, 16),
        hash32: crypto.createHash('md5').update(output.base64Image ? output.base64Image : output.buffer.toString()).digest('hex'),

        // 后缀名
        ext: output.extname.replace('.', ''),
    }

    let newPath = getNewPath(originalPath, formatData);

    newPath = newPath.split('\\').join('/')
    if (newPath.startsWith("/")) {
        newPath = newPath.substring(1, newPath.length)
    }
    if (replaceSlash) {
        newPath = newPath.split('/').join('%2F')
    }
    newPath = newPath + "." + formatData.ext

    return newPath
}

/**
 * Git Message 替换
 * @param originalMessage 原始配置中消息
 * @param fileNames 图片名参数
 */
export function formatMessage(originalMessage: string, fileNames: string): string {
    // 获取日期
    let date = new Date()

    // 格式化数据
    let formatData = {
        // 路径
        year: `${date.getFullYear()}`,
        month: date.getMonth() < 9 ? `0${date.getMonth() + 1}` : `${date.getMonth() + 1}`,
        day: `${date.getDate()}`,
        hour: `${date.getHours()}`,
        minute: `${date.getMinutes()}`,
        second: `${date.getSeconds()}`,
        milliseconds: `${date.getMilliseconds()}`,

        // 文件名
        fileName: fileNames
    }

    return getNewPath(originalMessage, formatData)
}


/**
 * 正则替换,将{}中的值替换成对应实际值
 */
function getNewPath(originalPath: string, formatData) {
    let out = 0
    let reg = /(?:{(\w+)})/g
    let result: RegExpExecArray
    let newPath = originalPath
    while (result = reg.exec(originalPath)) {
        // 替换文本
        newPath = newPath.replace(result[0], formatData[result[1]])

        // 避免死循环 一般没啥问题
        out++
        if (out > 100) break
    }
    return newPath;
}