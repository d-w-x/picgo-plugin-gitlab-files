# picgo-plugin-gitlab-files

PicGo Gitlab 上传插件

## 命令行配置方式

1. 安装 PicGo : `npm install -g picgo`
2. 安装本插件 : `picgo add gitlab-files`
3. 配置本插件 : `picgo config uploader`, 选择 `gitlab-files-uploader`, 按照下文配置
4. 激活插件 : `picgo use`
   1. `Use an uploader` -> `gitlab-files-uploader`
   2. `Use a transformer` -> `path`
   3. `Use plugins` 至少激活本插件
5. 使用插件 : `picgo upload`

## 配置

| 名称                   | 介绍                                                 | 配置示例                                                     |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| gitlab服务器地址       | 服务器地址,建议末尾不带`/`                           | `https://gitlab.com`                                         |
| 项目id                 | 在项目设置页面查看,后文介绍                          | `1254`                                                       |
| 默认分支               | 注意可能为main，也可以为其他分支                     | `master`                                                     |
| gitlab的token          | 获取方式见后文(PicGo会明文保存)                      | `fw45d1z7sa6rz69KOsxq`                                       |
| 文件名及其路径         | **可选**,文件名和路径,占位符见后文,是否以`/`开头均可 | `/pictures/{year}/{month}/{day}_{hour}_{minute}_{second}_{fileName}` |
| 上传文件的Message      | **可选**                                             | `Upload {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}` |
| 是否同步删除远程对象   | **可选**,本地删除文件后是否在Gitlab删除              | `false`                                                      |
| 删除文件的Message      | **可选**,                                            | `Delete {fileName} By PicGo gitlab files uploader at {year}-{month}-{day}` |
| 删除远程图片后是否通知 | **可选**,如果开启会有两个通知                        | `false`                                                      |
| 上传者的邮箱           | **可选**,建议不填写,可以不存在,可以不属于自己        | `test@example.com`                                           |
| 上传者的用户名         | **可选**,建议不填写,可以不存在,可以不属于自己        | `example`                                                    |

## 路径 Format

路径配置可使用以下参数，使用示例：`/{year}/{month}/{fileName}`，输出示例：`/2020/01/imba97.png`

| 名称         | 介绍                                      | 输出示例                         |
| ------------ | ----------------------------------------- | -------------------------------- |
| year         | 当前年份                                  | 2021                             |
| month        | 当前月份                                  | 01                               |
| day          | 当前日期                                  | 14                               |
| hour         | 当前小时                                  | 15                               |
| minute       | 当前分钟                                  | 35                               |
| second       | 当前秒数                                  | 36                               |
| milliseconds | 当前毫秒数                                | 452                              |
| fileName     | 图片名称，如果是多图，message取前三个文件 | imba97                           |
| =========    | **下列内容不可用于message**               | ==============                   |
| hash16       | 图片 MD5 16位                             | 68559cae1081d683                 |
| hash32       | 图片 MD5 32位                             | 68559cae1081d6836e09b043aa0b3af1 |
| ext          | 图片后缀名                                | png                              |

**注意**: 默认会向末尾自动增加文件后缀, `ext` 后缀用于路径,文件参数等使用



## 项目id获取示例

在 Gitlab 中打开项目:

<img src="https://github.com/D-W-X/picgo-plugin-gitlab-files/raw/master/picture/1.png" alt="打开项目" style="zoom:50%;" />

此处即为项目ID:

<img src="https://github.com/D-W-X/picgo-plugin-gitlab-files/raw/master/picture/2.png" alt="项目ID查看" style="zoom:50%;" />


## Gitlab Token 获取

**注意**：Token值会被PicGo明文保存! 下面任何一种方式均可

### 项目Token

1. 打开 Gitlab 侧栏,选择 设置-访问令牌

    <img src="https://github.com/D-W-X/picgo-plugin-gitlab-files/raw/master/picture/3.png" alt="获取访问令牌" style="zoom:50%;" />

2. 在弹出页面选择:

    <img src="https://github.com/D-W-X/picgo-plugin-gitlab-files/raw/master/picture/4.png" alt="选择访问令牌权限" style="zoom:50%;" />

    - 名称随意设置
    - 如果不设置时间表示不过期
    - 范围仅选择第一项或者仅选择第四项
    - 该方法生成的令牌只有项目访问权限

### 个人Token

1. 点击左上角用户头像,选择设置：

    <img src="https://github.com/D-W-X/picgo-plugin-gitlab-files/raw/master/picture/5.png" alt="打开用户界面" style="zoom:50%;" />

2. 在打开的窗口选择访问令牌：

    <img src="https://github.com/D-W-X/picgo-plugin-gitlab-files/raw/master/picture/6.png" alt="打开用户界面" style="zoom:50%;" />
    
    - 名称随意设置
    - 如果不设置时间表示不过期
    - 范围仅选择第一项或者仅选择第五项
    - 该方法生成的令牌访问权限较高,建议妥善保管

## 致谢

插件编写参考了[同款SCP插件](https://github.com/imba97/picgo-plugin-ssh-scp-uploader)的写法,感谢作者!

本项目和[已有的Gitlab上传插件](https://github.com/bugwz/picgo-plugin-gitlab)完全无关,应该也不会产生冲突! 由于已有插件上传后的文件无法查看,故而编写此插件.

