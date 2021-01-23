import picgo from 'picgo'
import {IImgInfo} from 'picgo/dist/src/types'
import crypto from 'crypto'

interface GitlabFilesLoaderUserConfig {
    gitUrl: string
    projectId: number
    branch: string
    fileName: string
    authorMail: string
    authorName: string
    commitMessage: string
    gitToken: string
}

interface GitlabFilesLoaderNeedReplacedMessage {
    filePath: string
    commitMessage: string
}

export = (ctx: picgo) => {

    const config = (ctx: picgo) => {
        let userConfig = ctx.getConfig<GitlabFilesLoaderUserConfig>('picBed.gitlab-files-uploader')
        if (!userConfig) {
            userConfig = {
                gitUrl: '',
                projectId: 0,
                branch: 'master',
                fileName: '/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}',
                authorMail: '',
                authorName: '',
                commitMessage: 'Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
                gitToken: ''
            }
        }
        return [
            {
                name: 'gitUrl',
                type: 'input',
                default: userConfig.gitUrl,
                required: true,
                message: 'https://gitlab.com',
                alias: 'gitlab服务器地址'
            },
            {
                name: 'projectId',
                type: 'input',
                default: userConfig.projectId,
                required: true,
                message: '0',
                alias: '项目id，在项目设置页面查看'
            },
            {
                name: 'branch',
                type: 'input',
                default: userConfig.branch,
                required: true,
                message: 'master',
                alias: '默认分支,注意可能为main'
            },
            {
                name: 'fileName',
                type: 'input',
                default: userConfig.fileName,
                required: true,
                message: '/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}',
                alias: '文件名及其路径'
            },
            {
                name: 'authorMail',
                type: 'input',
                default: userConfig.authorMail,
                required: true,
                message: 'test@example.com',
                alias: '上传者的邮箱'
            },
            {
                name: 'authorName',
                type: 'input',
                default: userConfig.authorName,
                required: true,
                message: 'example',
                alias: '上传者的用户名'
            },
            {
                name: 'commitMessage',
                type: 'input',
                default: userConfig.commitMessage,
                required: true,
                message: 'Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}',
                alias: '提交git的消息'
            },
            {
                name: 'gitToken',
                type: 'input',
                default: userConfig.gitToken,
                required: true,
                message: 'gitlab的token',
                alias: 'gitlab的token'
            }
        ]
    }

    const getProjectInfo = (userConfig: GitlabFilesLoaderUserConfig) => {
        let url
        if (userConfig.gitUrl.endsWith("/")) {
            url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId
        } else {
            url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId
        }

        return {
            method: 'GET',
            url: url,
            headers: {
                'PRIVATE-TOKEN': userConfig.gitToken,
                Date: new Date().toUTCString(),
            }
        }
    }

    const postData = (userConfig: GitlabFilesLoaderUserConfig, message: GitlabFilesLoaderNeedReplacedMessage, base64Image) => {
        let url
        if (userConfig.gitUrl.endsWith("/")) {
            url = userConfig.gitUrl + "api/v4/projects/" + userConfig.projectId + "/repository/files/" + message.filePath;
        } else {
            url = userConfig.gitUrl + "/api/v4/projects/" + userConfig.projectId + "/repository/files/" + message.filePath;
        }

        return {
            method: 'POST',
            url: url,
            headers: {
                'PRIVATE-TOKEN': userConfig.gitToken,
                Date: new Date().toUTCString(),
                'Content-Type': 'application/json',
                'User-Agent': 'PicGo'
            },
            body: {
                branch: userConfig.branch,
                author_email: userConfig.authorMail,
                author_name: userConfig.authorName,
                encoding: "base64",
                commit_message: message.commitMessage,
                content: base64Image
            },
            json: true
        }
    }

    const handle = async (ctx: picgo) => {
        let userConfig: GitlabFilesLoaderUserConfig = ctx.getConfig('picBed.gitlab-files-uploader')
        if (!userConfig) {
            throw new Error("Can't find uploader config")
        }

        const imgList = ctx.output;
        const options = getProjectInfo(userConfig);
        const body = await ctx.Request.request(options);
        let resultPath = JSON.parse(body).web_url + "/-/raw/"

        // 循环所有图片信息 上传
        for (const img of imgList) {
            if (!img.base64Image) {
                img.base64Image = img.buffer.toString('base64')
                delete img.buffer
            }

            await upload(img, userConfig)
                .then(response => {
                    let imgUrl = `${resultPath + response.branch}/${response.file_path}`
                    img.url = imgUrl
                    img.imgUrl = imgUrl

                    delete img.base64Image
                })
                .catch(err => {
                    ctx.log.error('gitlab 存储发生错误，请检查链接,项目id和Token是否正确')
                    ctx.log.error(err)
                    ctx.emit('notification', {
                        title: 'gitlab 存储错误',
                        body: '请检查链接,项目id和Token是否正确',
                        text: ''
                    })
                });
        }
        return ctx
    }

    const upload = (output: IImgInfo, userConfig: GitlabFilesLoaderUserConfig) => {
        // 获取格式化后的路径
        let pathInfo = formatPath(output, userConfig)

        const options = postData(userConfig, pathInfo, output.base64Image);
        let request = ctx.Request.request(options);

        ctx.log.info("===");
        ctx.log.info(`${output.buffer}`);
        ctx.log.info(`${output.base64Image}`);
        ctx.log.info(`${request.body}`);
        ctx.log.info("===");

        return request
    }

    const formatPath = (output: IImgInfo, userConfig: GitlabFilesLoaderUserConfig): GitlabFilesLoaderNeedReplacedMessage => {
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
        // 未格式化路径
        let pathInfo: GitlabFilesLoaderNeedReplacedMessage = {
            filePath: userConfig.fileName,
            commitMessage: userConfig.commitMessage
        }
        // 替换后的路径
        let formatPath: GitlabFilesLoaderNeedReplacedMessage = {
            filePath: '',
            commitMessage: ''
        }

        for (let key in pathInfo) {
            // 匹配 {} 内容
            let out = 0
            let reg = /(?:{(\w+)})/g
            formatPath[key] = pathInfo[key]
            let result: RegExpExecArray
            while (result = reg.exec(pathInfo[key])) {
                // 替换文本
                formatPath[key] = formatPath[key].replace(result[0], formatData[result[1]])

                // 避免死循环 一般没啥问题
                out++
                if (out > 100) break
            }

            if ("filePath" === key) {
                formatPath.filePath = formatPath.filePath.split('\\').join('/')

                if (formatPath.filePath.startsWith("/")) {
                    formatPath.filePath = formatPath.filePath.substring(1, formatPath.filePath.length)
                }
                formatPath.filePath = formatPath.filePath.split('/').join('%2F') + "." + formatData.ext
            }
        }

        return formatPath
    }

    const register = () => {
        ctx.helper.uploader.register('gitlab-files-uploader', {
            handle,
            config,
            name: 'gitlab files 图片上传'
        })
    }

    return {
        uploader: 'gitlab-files-uploader',
        register
    }
}
