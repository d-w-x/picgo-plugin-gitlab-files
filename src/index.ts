import picgo from 'picgo'
import {getProjectInfo, postMultiFiles, postSingleFile} from "./utils/gitlabApiCall";
import {formatMessage, formatPath} from "./utils/pathUtils";

const UPLOADER = 'gitlab-files-uploader'

export = (ctx: picgo) => {
    /**
     * 配置的常量
     */
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
                gitToken: '',
                deleteRemote: false
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
            },
            {
                name: 'deleteRemote',
                type: 'input',
                default: userConfig.deleteRemote,
                required: false,
                message: 'false',
                alias: '是否同步删除远程对象'
            }
        ]
    }

    /**
     * 核心方法
     */
    const handle = async (ctx: picgo) => {
        let userConfig: GitlabFilesLoaderUserConfig = ctx.getConfig('picBed.gitlab-files-uploader')
        if (!userConfig) {
            throw new Error("Can't find uploader config")
        }

        const imgList = ctx.output;
        const options = getProjectInfo(userConfig);
        const body = await ctx.Request.request(options);
        let resultPath = JSON.parse(body).web_url + "/-/raw/"

        if (imgList.length === 1) {
            let img = imgList[0];
            if (!img.base64Image) {
                img.base64Image = img.buffer.toString('base64')
                delete img.buffer
            }

            const options = postSingleFile(userConfig,
                formatPath(img, userConfig.fileName, true),
                formatMessage(userConfig.commitMessage, img.fileName),
                img.base64Image);
            await ctx.Request.request(options).then(response => {
                let imgUrl = `${resultPath + response.branch}/${response.file_path}`
                img.url = imgUrl
                img.imgUrl = imgUrl

                delete img.base64Image
            }).catch(err => {
                ctx.log.error('gitlab 存储发生错误，请检查链接,项目id和Token是否正确')
                ctx.log.error(err)
                ctx.emit('notification', {
                    title: 'gitlab 存储错误',
                    body: '请检查链接,项目id和Token是否正确',
                    text: ''
                })
            });
        } else {
            const options = postMultiFiles(userConfig, imgList)
            await ctx.Request.request(options).then(() => {
                imgList.forEach(img => {
                    let imgUrl = `${resultPath + userConfig.branch}/${img.newPath}`
                    delete img.base64Image
                    img.url = imgUrl
                    img.imgUrl = imgUrl
                })
            }).catch(err => {
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

    const register = () => {
        ctx.helper.uploader.register(UPLOADER, {
            handle,
            config,
            name: 'gitlab files 图片上传'
        })
        // ctx.on('remove', onRemove)
    }

    return {
        uploader: UPLOADER,
        register
    }
}
