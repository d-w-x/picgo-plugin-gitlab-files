/**
 * 配置文件接口
 */
interface GitlabFilesLoaderUserConfig {
    gitUrl: string,
    projectId: number,
    branch: string,
    gitToken: string,
    gitVersionUnderThirteen:boolean,
    fileName: string,
    commitMessage: string,
    deleteRemote: boolean,
    deleteMessage: string,
    deleteInform: boolean,
    authorMail: string,
    authorName: string
}

/**
 * 需要对内容替换的字符串
 */
interface GitlabFilesLoaderNeedReplacedMessage {
    filePath: string
    commitMessage: string,
}

/**
 * 删除文件时 PicGo 返回的图片信息
 */
interface RemoveImageType {
    fileName: string,
    extName: string,
    imgUrl: string,
    width?: number,
    height?: number,
    newPath?:string,
    type: string,
    id: string
}
